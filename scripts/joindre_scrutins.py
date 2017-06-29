import sys
import json
import heapq


def key_pop(o):
    d = o.pop('departement')
    c = o.pop('commune')
    b = o.pop('bureau')

    return d, c, b


def key_add(o, key):
    o.update({'departement': key[0], 'commune': key[1], 'bureau': key[2]})


def iterate_scrutin(name, f):
    for l in f:
        o = json.loads(l)
        key = key_pop(o)
        yield key, name, o


def join_bureaux(template, its):
    it = heapq.merge(*its)

    cur_key = None
    cur_obj = template.copy()

    for key, name, o in it:
        if key != cur_key:
            if cur_key is not None:
                yield cur_obj

            cur_key = key
            cur_obj = template.copy()
            key_add(cur_obj, key)

        cur_obj[name] = o

    if cur_key is not None:
        yield cur_obj


def joindre_scrutins(scrutins, dest):
    template = {s: None for s in scrutins}
    its = [iterate_scrutin(n, f) for n, f in scrutins.items()]

    for bureau in join_bureaux(template, its):
        # petit cas particulier à remplacer
        bureau['circonscription'] = bureau['legislatives-1']['circonscription'] if bureau['legislatives-1'] is not None else None

        json.dump(bureau, dest)
        dest.write('\n')


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/joindre_scrutins.py [nom_scrutin=nom_fichier]")
        sys.exit(1)

    scrutins = {s: open(f) for s, f in [sf.split('=', maxsplit=1) for sf in sys.argv[1:]]}

    joindre_scrutins(scrutins, sys.stdout)

    for f in scrutins.values():
        f.close()
