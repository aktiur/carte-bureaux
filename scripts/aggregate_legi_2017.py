import pandas as pd
import sys


def aggregate_bureaux(in_file, out_file):
    df = pd.read_csv(in_file, dtype={'departement': str, 'commune': str, 'bureau': str})

    stats = df.groupby(['departement', 'commune', 'bureau']).agg({
        'circonscription': 'first', 'inscrits': 'first', 'votants': 'first', 'exprimes': 'first'
    })

    par_nuance = df.groupby(
        ['departement', 'commune', 'bureau', 'nuance']
    )['voix'].sum().unstack().fillna(0, downcast='infer')

    pd.concat([stats, par_nuance], axis=1).to_csv(out_file)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/aggregate_legi_2017 fichier_source")
        sys.exit(1)

    with open(sys.argv[1], 'r') as in_file:
        aggregate_bureaux(in_file, sys.stdout)
