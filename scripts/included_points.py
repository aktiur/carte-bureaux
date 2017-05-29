import sys
import json
from shapely.geometry import shape
from shapely.ops import cascaded_union

TOLERANCE = 20 / 100_000  # 20 mètres en degrés (approximativement)


def filter_included_features(features, secteurs):
    circo = cascaded_union([shape(s['geometry']).buffer(TOLERANCE) for s in secteurs])

    return [f for f in features if f['geometry'] is not None and shape(f['geometry']).intersects(circo)]


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python scripts/clean_2017 < in > out")
        sys.exit(1)

    features_file = sys.argv[1]
    secteurs_file = sys.argv[2]

    with open(features_file) as ff, open(secteurs_file) as fs:
        feature_collection = json.load(ff)
        secteurs_collection = json.load(fs)

        included = filter_included_features(feature_collection['features'], secteurs_collection['features'])

    geojson = {
        "type": "FeatureCollection",
        "features": included
    }

    json.dump(geojson, sys.stdout)
