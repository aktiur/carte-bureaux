import os
import sys
from jinja2 import Template


def process_template(template_file, out_file):
    template = Template(template_file.read())
    out_file.write(template.render(**os.environ))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python scripts/process_template.py template_file > result_file")
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        process_template(f, sys.stdout)
