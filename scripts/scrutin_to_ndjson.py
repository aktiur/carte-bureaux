import csv
import json
import sys
from operator import itemgetter

headers_correct = {
    'Code du département': 'departement',
    'Libellé du département': None,
    'Code de la circonscription': 'circonscription',
    'Libellé de la circonscription': None,
    'Code de la commune': 'commune',
    'Libellé de la commune': None,
    'Code du b.vote': 'bureau',
    'Inscrits': 'inscrits',
    'Abstentions': None,
    '% Abs/Ins': None,
    'Votants': 'votants',
    '% Vot/Ins': None,
    'Blancs': 'blancs',
    '% Blancs/Ins': None,
    '% Blancs/Vot': None,
    'Nuls': None,
    '% Nuls/Ins': None,
    '% Nuls/Vot': None,
    'Exprimés': 'exprimes',
    '% Exp/Ins': None,
    '% Exp/Vot': None,
    'N°Panneau': None,
    'Sexe': 'sexe',
    'Nom': 'nom',
    'Prénom': 'prenom',
    'Nuance': 'nuance',
    'Voix': 'voix',
    '% Voix/Ins': None,
    '% Voix/Exp': None,
}
"""
Comment renommer les entêtes ?
"""

transforms = {
    'circonscription': int,
    'inscrits': int,
    'votants': int,
    'exprimes': int,
    'blancs': int,
    'voix': int,
}

nuances = {
    "DUPONT-AIGNAN": 'DLF',
    "LE PEN": 'FN',
    "MACRON": 'REM',
    "HAMON": 'SOC',
    "ARTHAUD": 'EXG',
    "POUTOU": 'EXG',
    "CHEMINADE": 'DIV',
    "LASSALLE": 'DVD',
    "M\u00c9LENCHON": 'FI',
    "ASSELINEAU": 'DVD',
    "FILLON": 'LR',
}


def clean_results(in_file, out_file):
    r = csv.reader(in_file, delimiter=';')

    headers = next(r)

    with_nuance = 'Nuance' in headers

    global_fields = headers[:-(7 + with_nuance)]
    repeated_fields = headers[-(7 + with_nuance):]

    global_pairs = [(i, headers_correct[f]) for i, f in enumerate(global_fields) if headers_correct[f] is not None]
    repeated_pairs = [(i, headers_correct[f]) for i, f in enumerate(repeated_fields) if headers_correct[f] is not None]

    for line in r:
        donnees_bureau = {f: transforms[f](line[i]) if f in transforms else line[i] for (i, f) in global_pairs}
        candidats = donnees_bureau['candidats'] = []
        for i in range(len(global_fields), len(line), len(repeated_fields)):
            candidats.append(
                {f: transforms[f](line[i + j]) if f in transforms else line[i + j] for (j, f) in repeated_pairs})
            if not with_nuance:
                candidats[-1]['nuance'] = nuances[candidats[-1]['nom']]

        candidats.sort(key=itemgetter('voix'), reverse=True)

        json.dump(donnees_bureau, out_file)
        out_file.write('\n')


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/scrutin_to_ndjson fichier_source")
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='latin1') as in_file:
        clean_results(in_file, sys.stdout)
