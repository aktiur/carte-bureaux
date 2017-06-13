import csv
import sys

headers_correct = {
    'Code du département': 'departement',
    'Libellé du département': 'departement_libelle',
    'Code de la circonscription': 'circonscription',
    'Libellé de la circonscription': 'circonscription_libelle',
    'Code de la commune': 'commune',
    'Libellé de la commune': 'commune_libelle',
    'Code du b.vote': 'bureau',
    'Inscrits': 'inscrits',
    'Abstentions': 'abstentions',
    '% Abs/Ins': None,
    'Votants': 'votants',
    '% Vot/Ins': None,
    'Blancs': 'blancs',
    '% Blancs/Ins': None,
    '% Blancs/Vot': None,
    'Nuls': 'nuls',
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


def clean_results(in_file, out_file):
    r = csv.reader(in_file, delimiter=';')

    headers = next(r)

    global_fields = headers[:-8]
    repeated_fields = headers[-8:]

    fields = [headers_correct[field] for field in global_fields+repeated_fields if headers_correct[field] is not None]
    global_indices = [i for i, f in enumerate(global_fields) if headers_correct[f] is not None]
    repeated_indices = [i for i, f in enumerate(repeated_fields) if headers_correct[f] is not None]

    in_file.seek(0)

    # on retire le header
    next(r)

    w = csv.writer(out_file)

    # on écrit le nouveau header
    w.writerow(fields)

    for line in r:
        global_values = [line[i] for i in global_indices]
        for i in range(len(global_fields), len(line), len(repeated_fields)):
            candidate_values = [line[i+j] for j in repeated_indices]
            w.writerow(global_values + candidate_values)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/clean_2017 fichier_source")
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='latin1') as in_file:
        clean_results(in_file, sys.stdout)
