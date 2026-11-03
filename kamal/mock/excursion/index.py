import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8084
RESOURCE = 'excursions'
DATA_FILE = Path(__file__).with_name('excursions.json')

with DATA_FILE.open(encoding='utf-8') as handle:
    ITEMS = {int(item_id): item for item_id, item in json.load(handle).items()}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
