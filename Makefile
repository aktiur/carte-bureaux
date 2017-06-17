PATH := node_modules/.bin:$(PATH)

CIRCOS_PARIS := 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18
CIRCOS_PARIS_SECTEURS := $(addprefix data/circos/secteurs-75-,$(addsuffix .geojson,$(CIRCOS_PARIS)))
CIRCOS_PARIS_BUREAUX := $(addprefix data/circos/bureaux-75-,$(addsuffix .geojson,$(CIRCOS_PARIS)))
CIRCOS_PARIS_HLMS := $(addprefix data/circos/hlms-75-,$(addsuffix .geojson,$(CIRCOS_PARIS)))
CIRCOS := 13-04 $(addprefix 75-,$(CIRCOS_PARIS)) 75-complet
CIRCOS_INDEX := $(addprefix dist/,$(addsuffix /index.html,$(CIRCOS)))
CIRCOS_SRC_SECTEURS := $(addprefix data/circos/secteurs-,$(addsuffix .geojson,$(CIRCOS)))
CIRCOS_DIST_TOPOLOGY := $(addprefix dist/,$(addsuffix /topology.json,$(CIRCOS)))
CIRCOS_DIR := $(addprefix dist/,$(CIRCOS))


all: $(CIRCOS_DIR) $(CIRCOS_INDEX) $(CIRCOS_DIST_TOPOLOGY) dist/images

$(CIRCOS_DIR) data/circos:
	mkdir -p $@

$(CIRCOS_INDEX): dist/%/index.html: index.html
	code_circo=$* python scripts/process_template.py $< > $@

dist/images: images/
	cp -r $< $@

$(CIRCOS_DIST_TOPOLOGY): dist/%/topology.json : data/circos/secteurs-%.geojson data/circos/bureaux-%.geojson data/circos/hlms-%.geojson
	geo2topo secteurs=data/circos/secteurs-$*.geojson bureaux=data/circos/bureaux-$*.geojson hlms=data/circos/hlms-$*.geojson > $@

data/circos/bureaux-13-04.geojson data/circos/hlms-13-04.geojson data/circos/hlms-75-complet.geojson:
	echo '{"type": "FeatureCollection", "features": []}' > $@

data/circos/secteurs-13-04.geojson: data/13-04.ndjson data/bureaux.ndjson |data/circos
	ndjson-join 'd.id' 'd.departement + d.commune + "-" + d.bureau' data/13-04.ndjson data/bureaux.ndjson \
	| ndjson-map 'd[0].properties = d[1], d[0]' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/13-04.ndjson: raw/13-04.topojson
	topo2geo -n 13-04=$@ < $<

$(CIRCOS_PARIS_HLMS): data/circos/hlms-75-%.geojson: raw/opendata_paris/logements_sociaux_finances_a_paris.geojson data/circos/secteurs-75-%.geojson |data/circos
	python scripts/included_points.py raw/opendata_paris/logements_sociaux_finances_a_paris.geojson data/circos/secteurs-75-$*.geojson \
	| ndjson-split 'd.features' \
	| ndjson-filter 'd.properties.nombre_total_de_logements_finances > 5' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/circos/bureaux-75-complet.geojson: data/bureaux_paris.ndjson |data/circos
	ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' < $< > $@

$(CIRCOS_PARIS_BUREAUX): data/circos/bureaux-75-%.geojson: data/bureaux_paris.ndjson |data/circos
	ndjson-filter 'd.properties.circonscription === "$*"' < $< \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/circos/secteurs-75-complet.geojson: data/secteurs_paris.ndjson |data/circos
	ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' < $< > $@

$(CIRCOS_PARIS_SECTEURS): data/circos/secteurs-75-%.geojson: data/secteurs_paris.ndjson |data/circos
	ndjson-filter 'd.properties.circonscription === +"$*"' < $< \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/bureaux_paris.ndjson: data/bureaux_paris.csv
	csv2json -n < $< \
	| ndjson-map -r _=lodash '{type: "Feature", geometry: JSON.parse(d.geojson), properties: Object.assign({bureaux: d.bureaux.split("/")}, _.omit(d, ["geojson", "bureaux"]))}' > $@

data/bureaux_paris.csv: raw/opendata_paris/bureaux-de-votes.csv data/2017_pres_cleaned.csv scripts/clean_bureaux.py
	python scripts/clean_bureaux.py $< data/2017_pres_cleaned.csv > $@

data/secteurs_paris.ndjson: raw/opendata_paris/secteurs-des-bureaux-de-vote.geojson data/bureaux.ndjson
	ndjson-split 'd.features' < $< \
	| ndjson-map 'd.properties.bureau = ("0" + d.properties.arrondissement).slice(-2) + ("0" + d.properties.num_bv).slice(-2), d.id = "75056-"+ d.properties.bureau, d' \
	| ndjson-join 'd.id' 'd.departement + d.commune + "-" + d.bureau' - data/bureaux.ndjson \
	| ndjson-map 'd[0].properties = d[1], d[0]' > $@


JOIN_SCRUTINS := 'Object.assign( \
	{ \
		presidentielle: _.pick(d[0], ["inscrits", "votants", "exprimes", "blancs", "candidats"]), \
		legislatives: _.pick(d[1], ["inscrits", "votants", "exprimes", "blancs", "candidats"]), \
	}, \
	_.pick(d[0], ["departement", "commune", "circonscription", "bureau"]))'

data/bureaux.ndjson: data/presidentielle.ndjson data/legislatives.ndjson
	ndjson-join 'd.departement+d.commune+d.bureau' $^ \
	| ndjson-map -r _=lodash $(JOIN_SCRUTINS) > $@

# legislatives
data/legislatives.ndjson: raw/data_gouv_fr/Leg_2017_Resultats_BVT_T1_c.txt
	python scripts/scrutin_to_ndjson.py $< > $@

# presidentielle
data/presidentielle.ndjson: raw/data_gouv_fr/PR17_BVot_T1_FE.txt
	python scripts/scrutin_to_ndjson.py $< > $@

# fichiers annexes

data/2017_pres_cleaned.csv: raw/data_gouv_fr/PR17_BVot_T1_FE.txt scripts/clean_pres_2017.py
	python scripts/clean_pres_2017.py $< > $@

data/2017_legi_cleaned.csv: raw/data_gouv_fr/Leg_2017_Resultats_BVT_T1_c.txt
	python scripts/clean_legi_2017.py $< > $@

clean:
	rm -rf data/* secteurs.svg
