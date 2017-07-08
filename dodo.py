import os
from pathlib import Path

# modify path to point to npm utilities
os.environ['PATH'] = './node_modules/.bin/' + os.pathsep + os.environ['PATH']

# default tasks
DOIT_CONFIG = {'default_tasks': ['copy_main_index', 'compile_bundle', 'copy_images', 'setup_map_index', 'make_topology']}

elections = [
    "presidentielle-1",
    "presidentielle-2",
    "legislatives-1",
    "legislatives-2"
]

circos_paris = range(1, 19)
arrondissements_paris = range(1, 21)

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

# fichier des secteurs par circonscription/arrondissement
secteurs_par_circo = "data/circos/secteurs-{code}.geojson"

# fichier des bureaux par circo/arrondissement
bureaux_par_circo = 'data/circos/bureaux-{code}.geojson'

# fichier des hlms par circo/arrondissement
hlms_par_circo = 'data/circos/hlms-{code}.geojson'


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


def task_copy_main_index():
    return {
        'targets': ['dist/index.html'],
        'file_dep': ['index.html'],
        'actions': ['python scripts/process_template.py index.html > dist/index.html']
    }


def task_setup_map_index():
    src = 'map_index.html'

    for num, type in [(c, 'C') for c in circos_paris] + [(a, 'A') for a in arrondissements_paris]:
        code = f'75{type}{num:02d}'
        target = f'dist/{code}/index.html'

        ordinal = '1ère' if num == 1 else f'{num}ème'
        label = 'circonscription' if type == 'C' else 'arrondissement'

        yield {
            'name': code,
            'targets': [target],
            'file_dep': [src],
            'actions': [
                create_dist_dir(code),
                f'code_circo="Résultats Paris - {ordinal} {label}" asset_path="../"'
                f' python scripts/process_template.py {src} > {target}'
            ]
        }


    target = 'dist/75-complet/index.html'

    yield {
        'name': '75-complet',
        'targets': [target],
        'file_dep': [src],
        'actions': [
            create_dist_dir('75-complet'),
            f'code_circo="Résultats électoraux à Paris" asset_path="../"'
            f' python scripts/process_template.py {src}  > {target}'
        ]
    }


def task_make_topology():
    for code in [f'75C{circo:02d}' for circo in circos_paris] + [f'75A{arr:02d}' for arr in arrondissements_paris]:
        target = f'dist/{code}/topology.json'
        src_files = {
            'secteurs': f'data/circos/secteurs-{code}.geojson',
            'bureaux': f'data/circos/bureaux-{code}.geojson',
            'hlms': f'data/circos/hlms-{code}.geojson'
        }

        topo_args = ' '.join([f'"{key}={file}"' for key, file in src_files.items()])

        yield {
            'name': code,
            'targets': [target],
            'file_dep': list(src_files.values()),
            'actions': [f'mkdir -p dist/{code}', f'geo2topo {topo_args} > {target}']
        }

    target = 'dist/75-complet/topology.json'
    src_files = {
        'secteurs': 'data/circos/secteurs-75-complet.geojson',
        'bureaux': 'data/circos/bureaux-75-complet.geojson',
        'hlms': 'data/circos/hlms-75-complet.geojson'
    }

    topo_args = ' '.join([f'"{key}={file}"' for key, file in src_files.items()])

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


def task_filtrer_hlms_parisiens():
    src = hlm_paris
    for code in [f'75C{c:02d}' for c in circos_paris] + [f'75A{a:02d}' for a in arrondissements_paris]:
        reference = secteurs_par_circo.format(code=code)
        target = hlms_par_circo.format(code=code)

        yield {
            'name': code,
            'targets': [target],
            'file_dep': [src, reference],
            'actions': [f"""python scripts/included_points.py "{src}" "{reference}" > {target}"""]
        }

    # pour Paris au complet
    target = hlms_par_circo.format(code='75-complet')
    yield {
        'name': 'complet',
        'targets': [target],
        'file_dep': [src],
        'actions': [f'cp {src} {target}']
    }


def task_filtrer_bureaux_parisiens():
    src = bureaux_paris_ndjson
    for circo in circos_paris:
        circo_code = f'75C{circo:02d}'
        target = bureaux_par_circo.format(code=circo_code)
        yield {
            'name': circo_code,
            'targets': [target],
            'file_dep': [src],
            'actions': [f"""
                ndjson-filter 'd.properties.circonscription === {circo}' < {src} \
                | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {target}
            """]
        }

    for arrondissement in arrondissements_paris:
        arrondissement_code = f'75A{arrondissement:02d}'
        target = bureaux_par_circo.format(code=arrondissement_code)
        yield {
            'name': arrondissement_code,
            'targets': [target],
            'file_dep': [src],
            'actions': [f"""
                ndjson-filter 'd.properties.bureaux[0].slice(0,2) === "{arrondissement:02d}"' < {src} \
                | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {target}
            """]
        }

    # pour Paris au complet
    target = bureaux_par_circo.format(code='75-complet')
    yield ndjson_to_geojson(src, target, name='complet')


def task_filtrer_secteurs_parisiens():
    src = 'data/secteurs_paris.ndjson'
    for circo in circos_paris:
        circo_code = f'75C{circo:02d}'
        target = secteurs_par_circo.format(code=circo_code)
        yield {
            'name': circo_code,
            'targets': [target],
            'file_dep': [src],
            'actions': [f"""
                ndjson-filter 'd.properties.circonscription === {circo}' < {src} \
                | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {target}
            """]
        }

    for arrondissement in arrondissements_paris:
        arrondissement_code = f"75A{arrondissement:02d}"
        target = secteurs_par_circo.format(code=arrondissement_code)
        yield {
            'name': arrondissement_code,
            'targets': [target],
            'file_dep': [src],
            'actions': [f"""
                ndjson-filter 'd.properties.bureau.slice(0,2) === "{arrondissement:02d}"' < {src} \
                | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {target}
            """]
        }

    # pour Paris au complet
    target = secteurs_par_circo.format(code='75-complet')
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


def create_dist_dir(code):
    return f'mkdir -p dist/{code}/'


def reduire_par_circo(src, dest, circo):
        return {
            'name': f'C{circo:02d}',
            'targets': [dest],
            'file_dep': [src],
            'actions': [f"""
                ndjson-filter 'd.properties.circonscription === {circo}' < {src} \
                | ndjson-reduce 'p.features.push(d), p' '{{type: "FeatureCollection", features: []}}' > {dest}
            """]
        }
