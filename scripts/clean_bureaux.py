import sys
import pandas as pd

COLONNES = {
    'Libellé du bureau de vote': 'libelle',
    'Adresse': 'adresse',
    'geo_shape': 'geojson'
}


def clean_bureaux(in_file, r_file, out_file):
    df = pd.read_csv(in_file, sep=';').rename(columns=COLONNES)
    results = pd.read_csv(r_file, usecols=['departement', 'circonscription', 'bureau'], dtype={'departement': str, 'bureau': str})

    corr_circo = results[results.departement == '75'].drop_duplicates().set_index('bureau')['circonscription']

    # normaliser le numéro de bureau de vote sur 4 caractères
    elem_bureaux = df['Identifiant du bureau de vote'].str.split('-')
    df['bureaux'] = elem_bureaux.str.get(0).str.pad(2, fillchar='0') + elem_bureaux.str.get(1).str.pad(2, fillchar='0')
    df['circonscription'] = df['bureaux'].map(corr_circo)

    # regrouper
    bureaux = df.groupby(['geojson', 'circonscription'], as_index=False).agg({
        'bureaux': lambda c: '/'.join(sorted(c.unique())),
        'libelle': lambda c: ' / '.join(sorted(c.unique())),
        'adresse': 'first',
    })

    bureaux.to_csv(out_file, index=False)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/clean_2017 < in > out")
        sys.exit(1)

    clean_bureaux(sys.argv[1], sys.argv[2], sys.stdout)
