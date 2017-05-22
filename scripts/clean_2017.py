import csv
import sys

headers_correct = {
    'Code du département': 'departement',
    'Libellé du département': 'departement_libelle',
    'Code de la circonscription': 'circo',
    'Libellé de la circonscription': 'circo_libelle',
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
}
"""
Comment renommer les entêtes ?
"""


def clean_results(in_file, out_filed):
        r = csv.reader(in_file, delimiter=';')

        headers = next(r)

        global_fields = headers[:-7]

        line = next(r)

        # on garde juste les noms de famille des candidats
        candidats = line[len(global_fields) + 2::7]

        fields = [headers_correct[field] for field in global_fields if headers_correct[field] is not None] + candidats
        global_indices = [i for i, f in enumerate(global_fields) if headers_correct[f] is not None]

        in_file.seek(0)

        # on retire le header
        next(r)

        w = csv.writer(out_filed)

        # on écrit le nouveau header
        w.writerow(fields)

        for line in r:
            noms = line[len(global_fields) + 2::7]
            scores = line[len(global_fields) + 4::7]

            paired_scores = {candidat: score for candidat, score in zip(noms, scores)}

            w.writerow([line[i] for i in global_indices] + [paired_scores[candidat] for candidat in candidats])


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/clean_2017 fichier_source")
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='latin1') as in_file:
        clean_results(in_file, sys.stdout)
