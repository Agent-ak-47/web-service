"""Insert the 10.6 integration-test charts and results into the technical document."""

import os

from docx import Document
from docx.shared import Cm

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DOC = os.path.join(ROOT, "res", "Document_Architecture_Technique_et_Web_Services_v1.1.docx")
CHARTS = os.path.join(ROOT, "res", "integration_charts")

SUMMARY = (
    "Lors de la dernière exécution sur la pile Docker complète, 44 tests sur 46 ont réussi "
    "(95,7 %) en 12,5 secondes ; 2 tests ont échoué. Les parcours nominaux complets "
    "(authentification, catalogues, réservation, paiement et remboursement) sont tous verts. "
    "Deux écarts de contrat ont toutefois été détectés : package-service renvoie le code "
    "ITEM_NOT_FOUND au lieu de NOT_FOUND sur un identifiant absent, alors que les services "
    "vols et excursions renvoient NOT_FOUND ; et le scénario de carte refusée utilise un "
    "numéro de carte non conforme (20 chiffres), rejeté en 400 INVALID_FORMAT par le service "
    "de paiement avant la simulation de refus, au lieu du 402 PAYMENT_DECLINED attendu. "
    "Ces deux points sont des anomalies de contrat révélées par la suite de tests, pas des "
    "régressions des parcours nominaux."
)

FIGURES = [
    (
        "01_resultat_global.png",
        "Figure 10.6-1 — Résultat global de la campagne d'intégration : 44 tests réussis "
        "sur 46 (95,7 %), 2 échecs, durée totale 12,5 s (source : integration/report.xml).",
    ),
    (
        "02_resultats_par_suite.png",
        "Figure 10.6-2 — Répartition des résultats par suite d'intégration "
        "(source : integration/report.xml).",
    ),
    (
        "03_duree_par_suite.png",
        "Figure 10.6-3 — Temps d'exécution cumulé par suite d'intégration "
        "(source : integration/report.xml).",
    ),
]


def find(doc, text):
    for paragraph in doc.paragraphs:
        if paragraph.text.strip() == text:
            return paragraph
    raise SystemExit(f"Paragraph not found: {text}")


def main():
    doc = Document(DOC)

    intro = find(
        doc,
        "Une suite de tests d'intégration inter-services a été ajoutée dans le dossier "
        "integration/. Elle s'exécute contre la pile Docker complète et ne simule aucun "
        "service : les 46 tests traversent réellement l'authentification, le jeton JWT, "
        "les catalogues, la réservation, la base MySQL, le paiement et le remboursement.",
    )
    intro.runs[0].text = (
        "Une suite de tests d'intégration inter-services a été ajoutée dans le dossier "
        "integration/. Elle s'exécute contre la pile Docker complète et ne simule aucun "
        "service : les 46 tests traversent réellement l'authentification, le jeton JWT, "
        "les catalogues, la réservation, la base MySQL, le paiement et le remboursement. "
        "Les résultats détaillés ci-dessous proviennent de la dernière exécution complète."
    )
    for extra in intro.runs[1:]:
        extra.text = ""

    anchor = find(doc, "10.7 Outils qualité logicielle")

    summary = anchor.insert_paragraph_before(SUMMARY)

    for filename, caption in FIGURES:
        image_paragraph = anchor.insert_paragraph_before()
        image_paragraph.add_run().add_picture(os.path.join(CHARTS, filename), width=Cm(15.5))
        anchor.insert_paragraph_before(caption)

    doc.save(DOC)
    print("Updated", DOC)


if __name__ == "__main__":
    main()
