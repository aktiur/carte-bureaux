PATH := node_modules/.bin:$(PATH)

CIRCOS_PARIS := 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18
CIRCOS_PARIS_JSON := $(addprefix data/circos/75-,$(addsuffix .geojson,$(CIRCOS_PARIS)))
CIRCOS := 13-04 $(addprefix 75-,$(CIRCOS_PARIS))
CIRCOS_INDEX := $(addprefix dist/,$(addsuffix /index.html,$(CIRCOS)))
CIRCOS_SRC_JSON := $(addprefix data/circos/,$(addsuffix .geojson,$(CIRCOS)))
CIRCOS_DIST_JSON := $(addprefix dist/,$(addsuffix /topology.json,$(CIRCOS)))
CIRCOS_DIR := $(addprefix dist/,$(CIRCOS))

VOTE_MAPPING := '{ \
  id: d.departement + d.commune + "-" + d.bureau, \
  circonscription: d.circo, \
  statistiques: _.mapValues(_.pick(d, Object.keys(d).slice(7, 13)), function(n){return +n;}), \
  votes: _.mapValues(_.pick(d, Object.keys(d).slice(13)), function(n){return +n;}) \
}'

all: $(CIRCOS_DIR) $(CIRCOS_INDEX) $(CIRCOS_DIST_JSON)

$(CIRCOS_DIR):
	mkdir -p $@

$(CIRCOS_INDEX): index.html
	cp $< $@

$(CIRCOS_DIST_JSON): dist/%/topology.json : data/circos/%.geojson
	echo $*
	geo2topo bureaux=$< > $@

data/circos/13-04.geojson: data/13-04.ndjson data/bureaux.ndjson
	ndjson-join 'd.id' $(VOTE_ID_FRAG) data/13-04.ndjson data/bureaux.ndjson \
	| ndjson-map -r _=lodash 'Object.assign(d[0].properties, _.pick(d[1], ["statistiques", "votes"])),d[0]' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/13-04.ndjson: raw/13-04.topojson
	topo2geo -n 13-04=$@ < $<

$(CIRCOS_PARIS_JSON): data/circos/75-%.geojson: data/secteurs_paris.ndjson
	ndjson-filter 'd.properties.circonscription === "$*"' < $< \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' > $@

data/secteurs_paris.ndjson: raw/secteurs-des-bureaux-de-vote.geojson data/bureaux.ndjson
	ndjson-split 'd.features' < $< \
	| ndjson-map 'd.properties.bureau = ("0" + d.properties.arrondissement).slice(-2) + ("0" + d.properties.num_bv).slice(-2), d.id = "75056-"+ d.properties.bureau, d' \
	| ndjson-join 'd.id' $(VOTE_ID_FRAG) - data/bureaux.ndjson \
	| ndjson-map -r _=lodash 'Object.assign(d[0].properties, _.pick(d[1], ["statistiques", "votes", "circonscription"])),d[0]' > $@

data/bureaux.ndjson: data/2017_cleaned.csv
	csv2json -n $< \
	| ndjson-map -r _=lodash $(VOTE_MAPPING) > $@

data/2017_cleaned.csv: raw/PR17_BVot_T1_FE.txt
	python scripts/clean_2017.py $< > $@

clean:
	rm -rf data/* secteurs.svg
