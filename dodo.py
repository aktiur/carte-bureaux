import os
from pathlib import Path

# modify path to point to npm utilities
os.environ['PATH'] = './node_modules/.bin/' + os.pathsep + os.environ['PATH']

# default tasks
DOIT_CONFIG = {'default_tasks': ['compile_bundle', 'copy_images', 'setup_index', 'make_topology']}

elections = [
    "presidentielle-1",
    "presidentielle-2",
    "legislatives-1",
    "legislatives-2"
]

circos_parisiennes = range(1, 19)

# FICHIERS INTERMEDIAIRES
# =======================
# les résultats par bureau de vote pour un scrutin en NDJSON :
resultats_bureaux_par_scrutin = 'data/bureaux_{scrutin}.ndjson'

# les résultats par bureau de vote, en NDJSON, tous scrutins:
resultats_bureaux_tous_scrutins = 'data/bureaux.ndjson'

# le fichier des secteurs parisiens
secteurs_paris = 'data/secteurs_paris.ndjson'

# hlm paris
hlm_paris = 'data/hlms-paris.geojson'

# le fichiers des emplacements des bureaux parisiens nettoyés
bureaux_paris_csv = 'data/bureaux_paris.csv'

# le fichier des bureaux parisiens en geojson
bureaux_paris_ndjson = 'data/bureaux_paris.ndjson'

# fichier des secteurs par circonscription
secteurs_par_circo = "data/circos/secteurs-{circo}.geojson"

# fichier des bureaux par circo
bureaux_par_circo = 'data/circos/bureaux-{circo}.geojson'

# fichier des hlms par circo
hlms_par_circo = 'data/circos/hlms-{circo}.geojson'


def task_creer_dossiers():
    yield {
        'basename': 'creer_dossiers',
        'actions': ['mkdir -p data/circos', 'mkdir -p dist/images']
    }


def task_compile_bundle():
    targets = ['dist/bundle.js', 'dist/style.css']

    exts = ['.css', '.js']
    src_files = [p for p in Path('src').iterdir() if p.suffix in exts]

    return {
        'targets': targets,
        'file_dep': src_files,
        'actions': ['npm run build']
    }


def task_setup_index():
    target = 'dist/75-complet/index.html'
    src = 'index.html'

    yield {
        'name': '75-complet',
        'targets': [target],
        'file_dep': [src],
        'actions': [
            'mkdir -p dist/75-complet/',
            f'''code_circo="complet" asset_path="../" python scripts/process_template.py {src}  > {target}'''
        ]
    }


def task_make_topology():
    target = 'dist/75-complet/topology.json'
    src_files = {
        'secteurs': 'data/circos/secteurs-75-complet.geojson',
        'bureaux': 'data/circos/bureaux-75-complet.geojson',
        'hlms': 'data/circos/hlms-75-complet.geojson'
    }

    topo_args = ' '.join([f'"{n}={f}"' for n, f in src_files.items()])

    yield {
        'name': '75-complet',
        'targets': [target],
        'file_dep': list(src_files.values()),
        'actions': ['mkdir -p dist/75-complet', f'geo2topo {topo_args} > {target}']
    }


def task_copy_images():
    images_dir = Path('images')
    exts = ['.jpg', '.jpeg', '.png', '.gif']
    images = [i for i in images_dir.iterdir() if i.suffix.lower() in exts]

    for img in images:
        dest = Path('dist', 'images', img.name)

        yield {
            'name': img.name,
            'file_dep': [img],
            'targets': [dest],
            'actions': [f'cp {img} {dest}']
        }


def task_filter_hlms_parisiens():
    src = hlm_paris
    for circo in circos_parisiennes:
        circo_code = f'75-{circo:02d}'
        reference = secteurs_par_circo.format(circo=circo_code)
        target = hlms_par_circo.format(circo=circo_code)

        yield {
            'name': f'{circo:02d}',
            'targets': [target],
            'file_dep': [src, reference],
            'actions': [f"""python scripts/included_points.py "{src}" "{reference}" """]
        }

    # pour Paris au complet
    target = hlms_par_circo.format(circo='75-complet')
    yield {
        'name': 'complet',
        'targets': [target],
        'file_dep': [src],
        'actions': [f'cp {src} {target}']
    }


def task_filtrer_bureaux_parisiens():
    src = bureaux_paris_ndjson
    for circo in circos_parisiennes:
        circo_code = f'75-{circo:02d}'
        target = bureaux_par_circo.format(circo=circo_code)
        yield reduire_par_circo(src, target, circo)

    # pour Paris au complet
    target = bureaux_par_circo.format(circo='75-complet')
    yield ndjson_to_geojson(src, target, name='complet')


def task_filtrer_secteurs_parisiens():
    src = 'data/secteurs_paris.ndjson'
    for circo in circos_parisiennes:
        circo_code = f'75-{circo:02d}'
        target = secteurs_par_circo.format(circo=circo_code)
        yield reduire_par_circo(src, target, circo)

    # pour Paris au complet
    target = secteurs_par_circo.format(circo='75-complet')
    yield ndjson_to_geojson(src, target, name='complet')


def task_convertir_bureaux_paris_en_geojson():
    target = bureaux_paris_ndjson
    src = bureaux_paris_csv

    return {
        'targets': [target],
        'file_dep': [src],
        'actions': ["""
            csv2json -n < "%s" \
            | ndjson-map 'd.circonscription = +d.circonscription, d' \
            | ndjson-map -r _=lodash '{type: "Feature", geometry: JSON.parse(d.geojson), properties: Object.assign({bureaux: d.bureaux.split("/")}, _.omit(d, ["geojson", "bureaux"]))}' \
            > "%s"
        """ % (src, target)]
    }


def task_nettoyer_hlms_paris():
    """

    :return:
    """
    src = 'raw/opendata_paris/logements_sociaux_finances_a_paris.geojson'
    target = hlm_paris

    return {
        'targets': [target],
        'file_dep': [src],
        'actions': [f"""
            ndjson-split 'd.features' < {src} \
            | ndjson-filter 'd.geometry !== null && d.properties.nombre_total_de_logements_finances > 30' \
            | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {target}
        """]
    }


def task_nettoyer_bureaux_paris():
    """Cette tâche fusionne les bureaux proches et assigne chaque bureau à sa circonscription
    """
    target = bureaux_paris_csv
    src = 'raw/opendata_paris/bureaux-de-votes.csv'
    reference = 'raw/resultats_electoraux/2017-legislatives-1_par_bureau_long.csv'

    return {
        'targets': [target],
        'file_dep': [src, reference],
        'actions': [f'python scripts/clean_bureaux.py "{src}" "{reference}" > "{target}"']
    }


def task_secteurs_paris():
    target = secteurs_paris
    src = 'raw/opendata_paris/secteurs-des-bureaux-de-vote.geojson'
    bureaux = resultats_bureaux_tous_scrutins

    return {
        'targets': [target],
        'file_dep': [src, resultats_bureaux_tous_scrutins],
        'actions': [f"""
            ndjson-split 'd.features' < "{src}" \
            | ndjson-map 'd.properties.bureau = ("0" + d.properties.arrondissement).slice(-2) + ("0" + d.properties.num_bv).slice(-2), d.id = "75056-"+ d.properties.bureau, d' \
            | ndjson-join 'd.id' 'd.departement + d.commune + "-" + d.bureau' - "{bureaux}" \
            | ndjson-map 'd[0].properties = d[1], d[0]' > "{target}"
        """]
    }


def task_joindre_scrutins():
    src_files = {e: resultats_bureaux_par_scrutin.format(scrutin=e) for e in elections}

    action = ' '.join(
        ['python scripts/joindre_scrutins.py'] +
        [f'"{e}={f}"' for e, f in src_files.items()] +
        [f'> "{resultats_bureaux_tous_scrutins}"']
    )

    return {
        'targets': [resultats_bureaux_tous_scrutins],
        'file_dep': list(src_files.values()),
        'actions': [action]
    }


def task_scrutin_to_ndjson():
    for election in elections:
        src = 'raw/resultats_electoraux/2017-{}_par_bureau_long.csv'.format(election)
        dest = resultats_bureaux_par_scrutin.format(scrutin=election)
        action = f'python scripts/scrutin_to_ndjson.py "{src}" > "{dest}"'

        yield {
            'name': election,
            'targets': [dest],
            'file_dep': [src],
            'actions': [action]
        }


# Utilitaires

def ndjson_to_geojson(src, dest, **kwargs):
    """Utilitaire pour réduire un fichier ndjson vers un fichier geojson
    """
    return {
        'targets': [dest],
        'file_dep': [src],
        'actions': [f"""
            ndjson-reduce 'p.features.push(d),p' '{{type:"FeatureCollection",features:[]}}' < "{src}" > "{dest}"
        """],
        **kwargs
    }


def reduire_par_circo(src, dest, circo):
    yield {
        'name': f'{circo:02d}',
        'targets': [dest],
        'file_dep': [src],
        'actions': [f"""
            ndjson-filter 'd.properties.circonscription === {circo}' < {src} \
            | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {dest}
        """]
    }
