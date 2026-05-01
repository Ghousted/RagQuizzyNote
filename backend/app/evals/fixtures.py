"""Frozen eval fixtures. Do NOT edit without bumping the version and re-running the harness."""

VERSION = "1.0"

NOTE_DNA = """
DNA replication is the process by which a cell copies its DNA before cell division.
It follows a semi-conservative model, meaning each new double helix retains one original strand.
The process begins at origins of replication, where helicase unwinds the double helix.
Primase adds RNA primers to provide a starting point for DNA polymerase.
DNA polymerase synthesizes new strands in the 5' to 3' direction.
The leading strand is synthesized continuously, while the lagging strand is synthesized
in short fragments called Okazaki fragments, which are later joined by DNA ligase.
"""

NOTE_WATER_CYCLE = """
The water cycle, also called the hydrological cycle, describes the continuous movement of water.
Evaporation converts liquid water to vapor using solar energy.
Transpiration from plants also adds water vapor to the atmosphere.
Water vapor rises, cools, and condenses around dust particles to form clouds (condensation).
Precipitation returns water to Earth as rain, snow, or hail.
Surface runoff and groundwater infiltration return water to rivers, lakes, and oceans.
The cycle is driven primarily by solar energy and gravity.
"""

FIXTURES = [
    {
        "id": "flashcards_dna_replication",
        "type": "flashcards",
        "note_content": NOTE_DNA,
        "criteria": {
            "min_count": 3,
            "required_concepts": ["helicase", "polymerase", "semi-conservative"],
            "schema_required": ["question", "answer"],
        },
    },
    {
        "id": "quiz_water_cycle",
        "type": "quiz",
        "note_content": NOTE_WATER_CYCLE,
        "criteria": {
            "min_count": 3,
            "options_count": 4,
            "schema_required": ["question", "options", "correct_index", "explanation"],
        },
    },
    {
        "id": "judge_calibration",
        "type": "judge",
        "cases": [
            {
                "question": "What is the semi-conservative model of DNA replication?",
                "reference": "Each new DNA double helix retains one original strand and one newly synthesized strand.",
                "answer": "Each daughter DNA molecule keeps one strand from the parent and gets one new strand.",
                "expected_score_min": 0.75,
            },
            {
                "question": "What is the semi-conservative model of DNA replication?",
                "reference": "Each new DNA double helix retains one original strand and one newly synthesized strand.",
                "answer": "DNA splits completely and both strands are newly made.",
                "expected_score_max": 0.4,
            },
        ],
    },
]
