/* Grid Club Dot Trails v0.7 — 75 fixed, versioned puzzles and local-only progression.
 * One immutable entry per puzzle, IDs 1–75. Clients must not rely on this
 * as a trustworthy credit ledger for future paid purchases. */
(function(root){'use strict';
const ITEMS=[
  {
    "id": 1,
    "stage": 1,
    "step": 1,
    "size": 5,
    "seed": 795820172,
    "quality": 41,
    "pairs": 4,
    "limitSec": null
  },
  {
    "id": 2,
    "stage": 1,
    "step": 2,
    "size": 5,
    "seed": 990102252,
    "quality": 42,
    "pairs": 5,
    "limitSec": 35
  },
  {
    "id": 3,
    "stage": 1,
    "step": 3,
    "size": 5,
    "seed": 3336858684,
    "quality": 43,
    "pairs": 4,
    "limitSec": 22
  },
  {
    "id": 4,
    "stage": 1,
    "step": 4,
    "size": 5,
    "seed": 1065111147,
    "quality": 45,
    "pairs": 4,
    "limitSec": 18
  },
  {
    "id": 5,
    "stage": 1,
    "step": 5,
    "size": 5,
    "seed": 3792664600,
    "quality": 45,
    "pairs": 4,
    "limitSec": 15
  },
  {
    "id": 6,
    "stage": 2,
    "step": 1,
    "size": 5,
    "seed": 2049612900,
    "quality": 42,
    "pairs": 3,
    "limitSec": null
  },
  {
    "id": 7,
    "stage": 2,
    "step": 2,
    "size": 5,
    "seed": 4119497802,
    "quality": 43,
    "pairs": 4,
    "limitSec": 26
  },
  {
    "id": 8,
    "stage": 2,
    "step": 3,
    "size": 5,
    "seed": 3673714593,
    "quality": 44,
    "pairs": 3,
    "limitSec": 22
  },
  {
    "id": 9,
    "stage": 2,
    "step": 4,
    "size": 5,
    "seed": 1016354795,
    "quality": 46,
    "pairs": 3,
    "limitSec": 18
  },
  {
    "id": 10,
    "stage": 2,
    "step": 5,
    "size": 5,
    "seed": 1953363328,
    "quality": 52,
    "pairs": 3,
    "limitSec": 14
  },
  {
    "id": 11,
    "stage": 3,
    "step": 1,
    "size": 7,
    "seed": 1012543585,
    "quality": 85,
    "pairs": 6,
    "limitSec": null
  },
  {
    "id": 12,
    "stage": 3,
    "step": 2,
    "size": 7,
    "seed": 2071600745,
    "quality": 86,
    "pairs": 7,
    "limitSec": 145
  },
  {
    "id": 13,
    "stage": 3,
    "step": 3,
    "size": 7,
    "seed": 1766392096,
    "quality": 82,
    "pairs": 5,
    "limitSec": 127
  },
  {
    "id": 14,
    "stage": 3,
    "step": 4,
    "size": 7,
    "seed": 2115703046,
    "quality": 83,
    "pairs": 5,
    "limitSec": 109
  },
  {
    "id": 15,
    "stage": 3,
    "step": 5,
    "size": 7,
    "seed": 803777731,
    "quality": 84,
    "pairs": 5,
    "limitSec": 91
  },
  {
    "id": 16,
    "stage": 4,
    "step": 1,
    "size": 7,
    "seed": 4258491324,
    "quality": 84,
    "pairs": 7,
    "limitSec": null
  },
  {
    "id": 17,
    "stage": 4,
    "step": 2,
    "size": 7,
    "seed": 272099129,
    "quality": 86,
    "pairs": 5,
    "limitSec": 130
  },
  {
    "id": 18,
    "stage": 4,
    "step": 3,
    "size": 7,
    "seed": 3115186422,
    "quality": 86,
    "pairs": 5,
    "limitSec": 112
  },
  {
    "id": 19,
    "stage": 4,
    "step": 4,
    "size": 7,
    "seed": 3795957438,
    "quality": 87,
    "pairs": 5,
    "limitSec": 94
  },
  {
    "id": 20,
    "stage": 4,
    "step": 5,
    "size": 7,
    "seed": 1411075834,
    "quality": 89,
    "pairs": 6,
    "limitSec": 76
  },
  {
    "id": 21,
    "stage": 5,
    "step": 1,
    "size": 7,
    "seed": 1158382795,
    "quality": 90,
    "pairs": 5,
    "limitSec": null
  },
  {
    "id": 22,
    "stage": 5,
    "step": 2,
    "size": 7,
    "seed": 4104311513,
    "quality": 90,
    "pairs": 5,
    "limitSec": 115
  },
  {
    "id": 23,
    "stage": 5,
    "step": 3,
    "size": 7,
    "seed": 1029353648,
    "quality": 92,
    "pairs": 5,
    "limitSec": 97
  },
  {
    "id": 24,
    "stage": 5,
    "step": 4,
    "size": 7,
    "seed": 4035561720,
    "quality": 92,
    "pairs": 5,
    "limitSec": 79
  },
  {
    "id": 25,
    "stage": 5,
    "step": 5,
    "size": 7,
    "seed": 54482474,
    "quality": 95,
    "pairs": 6,
    "limitSec": 61
  },
  {
    "id": 26,
    "stage": 6,
    "step": 1,
    "size": 9,
    "seed": 1545214817,
    "quality": 138,
    "pairs": 8,
    "limitSec": null
  },
  {
    "id": 27,
    "stage": 6,
    "step": 2,
    "size": 9,
    "seed": 1085578332,
    "quality": 139,
    "pairs": 8,
    "limitSec": 270
  },
  {
    "id": 28,
    "stage": 6,
    "step": 3,
    "size": 9,
    "seed": 2664783832,
    "quality": 145,
    "pairs": 10,
    "limitSec": 243
  },
  {
    "id": 29,
    "stage": 6,
    "step": 4,
    "size": 9,
    "seed": 1022997438,
    "quality": 141,
    "pairs": 7,
    "limitSec": 216
  },
  {
    "id": 30,
    "stage": 6,
    "step": 5,
    "size": 9,
    "seed": 814754114,
    "quality": 142,
    "pairs": 8,
    "limitSec": 189
  },
  {
    "id": 31,
    "stage": 7,
    "step": 1,
    "size": 9,
    "seed": 1262601720,
    "quality": 143,
    "pairs": 10,
    "limitSec": null
  },
  {
    "id": 32,
    "stage": 7,
    "step": 2,
    "size": 9,
    "seed": 3614824048,
    "quality": 148,
    "pairs": 8,
    "limitSec": 255
  },
  {
    "id": 33,
    "stage": 7,
    "step": 3,
    "size": 9,
    "seed": 3202848393,
    "quality": 149,
    "pairs": 8,
    "limitSec": 228
  },
  {
    "id": 34,
    "stage": 7,
    "step": 4,
    "size": 9,
    "seed": 2604271977,
    "quality": 145,
    "pairs": 7,
    "limitSec": 201
  },
  {
    "id": 35,
    "stage": 7,
    "step": 5,
    "size": 9,
    "seed": 2651937705,
    "quality": 146,
    "pairs": 9,
    "limitSec": 174
  },
  {
    "id": 36,
    "stage": 8,
    "step": 1,
    "size": 9,
    "seed": 166226948,
    "quality": 147,
    "pairs": 7,
    "limitSec": null,
    "blocked": [
      [
        3,
        5
      ],
      [
        4,
        5
      ],
      [
        2,
        6
      ],
      [
        3,
        6
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        7,
        6
      ],
      [
        2,
        7
      ],
      [
        3,
        7
      ],
      [
        4,
        7
      ],
      [
        7,
        7
      ],
      [
        7,
        8
      ]
    ]
  },
  {
    "id": 37,
    "stage": 8,
    "step": 2,
    "size": 9,
    "seed": 2769850612,
    "quality": 148,
    "pairs": 8,
    "limitSec": 240,
    "blocked": [
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        5,
        2
      ],
      [
        8,
        2
      ],
      [
        5,
        3
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        8,
        3
      ],
      [
        7,
        4
      ],
      [
        8,
        4
      ]
    ]
  },
  {
    "id": 38,
    "stage": 8,
    "step": 3,
    "size": 9,
    "seed": 1186970392,
    "quality": 149,
    "pairs": 8,
    "limitSec": 213,
    "blocked": [
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        7,
        5
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        7,
        6
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        7,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        8
      ]
    ]
  },
  {
    "id": 39,
    "stage": 8,
    "step": 4,
    "size": 9,
    "seed": 177447278,
    "quality": 150,
    "pairs": 8,
    "limitSec": 186,
    "blocked": [
      [
        3,
        0
      ],
      [
        4,
        0
      ],
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        3,
        1
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        3,
        2
      ]
    ]
  },
  {
    "id": 40,
    "stage": 8,
    "step": 5,
    "size": 9,
    "seed": 4085123098,
    "quality": 150,
    "pairs": 7,
    "limitSec": 159,
    "blocked": [
      [
        5,
        3
      ],
      [
        6,
        3
      ],
      [
        5,
        4
      ],
      [
        6,
        4
      ],
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        7,
        5
      ],
      [
        7,
        6
      ],
      [
        6,
        7
      ],
      [
        7,
        7
      ]
    ]
  },
  {
    "id": 41,
    "stage": 9,
    "step": 1,
    "size": 9,
    "seed": 2309208829,
    "quality": 151,
    "pairs": 8,
    "limitSec": null,
    "blocked": [
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        2,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ]
    ]
  },
  {
    "id": 42,
    "stage": 9,
    "step": 2,
    "size": 9,
    "seed": 795431278,
    "quality": 152,
    "pairs": 7,
    "limitSec": 225,
    "blocked": [
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        8,
        2
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        8,
        3
      ],
      [
        7,
        4
      ],
      [
        8,
        4
      ]
    ]
  },
  {
    "id": 43,
    "stage": 9,
    "step": 3,
    "size": 9,
    "seed": 3396125214,
    "quality": 158,
    "pairs": 9,
    "limitSec": 198,
    "blocked": [
      [
        2,
        0
      ],
      [
        3,
        0
      ],
      [
        4,
        0
      ],
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        2,
        1
      ],
      [
        3,
        1
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        2
      ]
    ]
  },
  {
    "id": 44,
    "stage": 9,
    "step": 4,
    "size": 9,
    "seed": 1581651908,
    "quality": 154,
    "pairs": 9,
    "limitSec": 171,
    "blocked": [
      [
        1,
        0
      ],
      [
        2,
        0
      ],
      [
        3,
        0
      ],
      [
        1,
        1
      ],
      [
        2,
        1
      ],
      [
        3,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        2
      ],
      [
        3,
        2
      ],
      [
        2,
        3
      ],
      [
        3,
        3
      ]
    ]
  },
  {
    "id": 45,
    "stage": 9,
    "step": 5,
    "size": 9,
    "seed": 1467406076,
    "quality": 155,
    "pairs": 9,
    "limitSec": 144,
    "blocked": [
      [
        7,
        4
      ],
      [
        8,
        4
      ],
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        7,
        5
      ],
      [
        8,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        7,
        6
      ],
      [
        8,
        6
      ]
    ]
  },
  {
    "id": 46,
    "stage": 10,
    "step": 1,
    "size": 11,
    "seed": 3379839868,
    "quality": 215,
    "pairs": 11,
    "limitSec": null,
    "blocked": [
      [
        10,
        0
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        9,
        3
      ],
      [
        10,
        3
      ],
      [
        9,
        4
      ],
      [
        10,
        4
      ],
      [
        10,
        5
      ]
    ]
  },
  {
    "id": 47,
    "stage": 10,
    "step": 2,
    "size": 11,
    "seed": 2506507411,
    "quality": 216,
    "pairs": 9,
    "limitSec": 660,
    "blocked": [
      [
        2,
        2
      ],
      [
        3,
        2
      ],
      [
        2,
        3
      ],
      [
        2,
        4
      ],
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        2,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        1,
        9
      ]
    ]
  },
  {
    "id": 48,
    "stage": 10,
    "step": 3,
    "size": 11,
    "seed": 1242181518,
    "quality": 217,
    "pairs": 12,
    "limitSec": 605,
    "blocked": [
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        6,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ],
      [
        3,
        8
      ],
      [
        4,
        8
      ],
      [
        5,
        8
      ],
      [
        6,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        2,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ]
    ]
  },
  {
    "id": 49,
    "stage": 10,
    "step": 4,
    "size": 11,
    "seed": 367975833,
    "quality": 223,
    "pairs": 9,
    "limitSec": 550,
    "blocked": [
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        7,
        2
      ],
      [
        8,
        2
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        10,
        3
      ],
      [
        10,
        4
      ],
      [
        9,
        5
      ],
      [
        10,
        5
      ]
    ]
  },
  {
    "id": 50,
    "stage": 10,
    "step": 5,
    "size": 11,
    "seed": 2082585713,
    "quality": 223,
    "pairs": 11,
    "limitSec": 495,
    "blocked": [
      [
        6,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        2
      ],
      [
        3,
        2
      ],
      [
        6,
        2
      ],
      [
        1,
        3
      ],
      [
        2,
        3
      ],
      [
        3,
        3
      ],
      [
        4,
        3
      ],
      [
        5,
        3
      ],
      [
        6,
        3
      ],
      [
        1,
        4
      ],
      [
        2,
        4
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        2,
        6
      ]
    ]
  },
  {
    "id": 51,
    "stage": 11,
    "step": 1,
    "size": 11,
    "seed": 1572249237,
    "quality": 224,
    "pairs": 12,
    "limitSec": null,
    "blocked": [
      [
        3,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        2,
        7
      ],
      [
        3,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ]
    ]
  },
  {
    "id": 52,
    "stage": 11,
    "step": 2,
    "size": 11,
    "seed": 613807623,
    "quality": 220,
    "pairs": 10,
    "limitSec": 642,
    "blocked": [
      [
        4,
        8
      ],
      [
        5,
        8
      ],
      [
        6,
        8
      ],
      [
        7,
        8
      ],
      [
        4,
        9
      ],
      [
        5,
        9
      ],
      [
        6,
        9
      ],
      [
        7,
        9
      ],
      [
        8,
        9
      ],
      [
        5,
        10
      ],
      [
        6,
        10
      ],
      [
        7,
        10
      ],
      [
        8,
        10
      ]
    ]
  },
  {
    "id": 53,
    "stage": 11,
    "step": 3,
    "size": 11,
    "seed": 2895064763,
    "quality": 225,
    "pairs": 12,
    "limitSec": 587,
    "blocked": [
      [
        8,
        6
      ],
      [
        8,
        7
      ],
      [
        9,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        8
      ],
      [
        9,
        8
      ],
      [
        6,
        9
      ],
      [
        7,
        9
      ],
      [
        8,
        9
      ],
      [
        9,
        9
      ],
      [
        6,
        10
      ],
      [
        7,
        10
      ]
    ]
  },
  {
    "id": 54,
    "stage": 11,
    "step": 4,
    "size": 11,
    "seed": 4067119052,
    "quality": 220,
    "pairs": 10,
    "limitSec": 532,
    "blocked": [
      [
        2,
        0
      ],
      [
        3,
        0
      ],
      [
        4,
        0
      ],
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        2,
        1
      ],
      [
        3,
        1
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        2,
        2
      ],
      [
        5,
        2
      ]
    ]
  },
  {
    "id": 55,
    "stage": 11,
    "step": 5,
    "size": 11,
    "seed": 647733889,
    "quality": 221,
    "pairs": 11,
    "limitSec": 477,
    "blocked": [
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        3,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ],
      [
        3,
        6
      ],
      [
        3,
        7
      ],
      [
        3,
        8
      ],
      [
        4,
        8
      ],
      [
        3,
        9
      ],
      [
        4,
        9
      ],
      [
        3,
        10
      ],
      [
        4,
        10
      ]
    ]
  },
  {
    "id": 56,
    "stage": 12,
    "step": 1,
    "size": 11,
    "seed": 4036546560,
    "quality": 221,
    "pairs": 12,
    "limitSec": null,
    "blocked": [
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        7,
        2
      ],
      [
        8,
        2
      ]
    ]
  },
  {
    "id": 57,
    "stage": 12,
    "step": 2,
    "size": 11,
    "seed": 4112894139,
    "quality": 222,
    "pairs": 9,
    "limitSec": 624,
    "blocked": [
      [
        5,
        4
      ],
      [
        6,
        4
      ],
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        7,
        5
      ],
      [
        8,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        7,
        6
      ],
      [
        8,
        6
      ],
      [
        9,
        6
      ],
      [
        5,
        7
      ],
      [
        6,
        7
      ],
      [
        9,
        7
      ],
      [
        9,
        8
      ]
    ]
  },
  {
    "id": 58,
    "stage": 12,
    "step": 3,
    "size": 11,
    "seed": 1132099017,
    "quality": 223,
    "pairs": 12,
    "limitSec": 569,
    "blocked": [
      [
        2,
        3
      ],
      [
        2,
        4
      ],
      [
        3,
        4
      ],
      [
        3,
        5
      ],
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        3,
        6
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        3,
        7
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ]
    ]
  },
  {
    "id": 59,
    "stage": 12,
    "step": 4,
    "size": 11,
    "seed": 3184510745,
    "quality": 228,
    "pairs": 12,
    "limitSec": 514,
    "blocked": [
      [
        2,
        0
      ],
      [
        1,
        1
      ],
      [
        2,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        2
      ],
      [
        1,
        3
      ],
      [
        2,
        3
      ],
      [
        1,
        4
      ],
      [
        2,
        4
      ],
      [
        2,
        5
      ]
    ]
  },
  {
    "id": 60,
    "stage": 12,
    "step": 5,
    "size": 11,
    "seed": 393660394,
    "quality": 224,
    "pairs": 10,
    "limitSec": 459,
    "blocked": [
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        5,
        7
      ],
      [
        6,
        7
      ],
      [
        5,
        8
      ],
      [
        6,
        8
      ],
      [
        7,
        8
      ],
      [
        8,
        8
      ],
      [
        5,
        9
      ],
      [
        6,
        9
      ],
      [
        7,
        9
      ]
    ]
  },
  {
    "id": 61,
    "stage": 13,
    "step": 1,
    "size": 11,
    "seed": 2570080320,
    "quality": 224,
    "pairs": 10,
    "limitSec": null,
    "blocked": [
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        7,
        1
      ],
      [
        3,
        2
      ],
      [
        4,
        2
      ],
      [
        5,
        2
      ],
      [
        6,
        2
      ],
      [
        7,
        2
      ],
      [
        3,
        3
      ],
      [
        4,
        3
      ],
      [
        5,
        3
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        4
      ],
      [
        5,
        4
      ],
      [
        4,
        8
      ],
      [
        3,
        9
      ],
      [
        4,
        9
      ],
      [
        3,
        10
      ],
      [
        4,
        10
      ],
      [
        5,
        10
      ],
      [
        6,
        10
      ]
    ]
  },
  {
    "id": 62,
    "stage": 13,
    "step": 2,
    "size": 11,
    "seed": 1187234530,
    "quality": 225,
    "pairs": 9,
    "limitSec": 606,
    "blocked": [
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        8,
        2
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        0,
        3
      ],
      [
        1,
        3
      ],
      [
        2,
        3
      ],
      [
        10,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        4
      ],
      [
        2,
        4
      ],
      [
        3,
        4
      ],
      [
        10,
        4
      ],
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        3,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        0,
        8
      ]
    ]
  },
  {
    "id": 63,
    "stage": 13,
    "step": 3,
    "size": 11,
    "seed": 3269468472,
    "quality": 226,
    "pairs": 10,
    "limitSec": 551,
    "blocked": [
      [
        3,
        0
      ],
      [
        4,
        0
      ],
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        3,
        1
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ],
      [
        3,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        2,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ],
      [
        2,
        10
      ]
    ]
  },
  {
    "id": 64,
    "stage": 13,
    "step": 4,
    "size": 11,
    "seed": 384045154,
    "quality": 227,
    "pairs": 11,
    "limitSec": 496,
    "blocked": [
      [
        3,
        0
      ],
      [
        4,
        0
      ],
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        3,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        2,
        7
      ],
      [
        3,
        7
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ],
      [
        3,
        8
      ],
      [
        4,
        8
      ],
      [
        5,
        8
      ],
      [
        1,
        9
      ],
      [
        2,
        9
      ],
      [
        3,
        9
      ],
      [
        4,
        9
      ]
    ]
  },
  {
    "id": 65,
    "stage": 13,
    "step": 5,
    "size": 11,
    "seed": 2292019363,
    "quality": 227,
    "pairs": 10,
    "limitSec": 441,
    "blocked": [
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        6,
        2
      ],
      [
        7,
        2
      ],
      [
        8,
        2
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        8,
        3
      ],
      [
        6,
        4
      ],
      [
        7,
        4
      ],
      [
        8,
        4
      ],
      [
        6,
        5
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        4,
        8
      ],
      [
        5,
        8
      ],
      [
        3,
        9
      ],
      [
        4,
        9
      ]
    ]
  },
  {
    "id": 66,
    "stage": 14,
    "step": 1,
    "size": 11,
    "seed": 1696603738,
    "quality": 228,
    "pairs": 9,
    "limitSec": null,
    "blocked": [
      [
        0,
        0
      ],
      [
        1,
        0
      ],
      [
        2,
        0
      ],
      [
        0,
        1
      ],
      [
        1,
        1
      ],
      [
        2,
        1
      ],
      [
        0,
        2
      ],
      [
        1,
        2
      ],
      [
        2,
        2
      ],
      [
        0,
        3
      ],
      [
        1,
        3
      ],
      [
        2,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        4
      ],
      [
        8,
        4
      ],
      [
        9,
        4
      ],
      [
        10,
        4
      ],
      [
        8,
        5
      ],
      [
        9,
        5
      ],
      [
        10,
        5
      ],
      [
        7,
        6
      ],
      [
        8,
        6
      ],
      [
        9,
        6
      ],
      [
        10,
        6
      ],
      [
        7,
        7
      ],
      [
        8,
        7
      ],
      [
        9,
        7
      ],
      [
        10,
        7
      ],
      [
        9,
        8
      ],
      [
        10,
        8
      ]
    ]
  },
  {
    "id": 67,
    "stage": 14,
    "step": 2,
    "size": 11,
    "seed": 679670292,
    "quality": 229,
    "pairs": 11,
    "limitSec": 588,
    "blocked": [
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        5,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        5,
        2
      ],
      [
        6,
        2
      ],
      [
        7,
        2
      ],
      [
        8,
        2
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        10,
        3
      ],
      [
        10,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        3,
        6
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        6,
        6
      ],
      [
        3,
        7
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        6,
        7
      ],
      [
        4,
        8
      ]
    ]
  },
  {
    "id": 68,
    "stage": 14,
    "step": 3,
    "size": 11,
    "seed": 1364159629,
    "quality": 230,
    "pairs": 10,
    "limitSec": 533,
    "blocked": [
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        7,
        0
      ],
      [
        4,
        1
      ],
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        4,
        2
      ],
      [
        3,
        3
      ],
      [
        4,
        3
      ],
      [
        2,
        4
      ],
      [
        3,
        4
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        2,
        9
      ],
      [
        3,
        9
      ],
      [
        4,
        9
      ],
      [
        5,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ],
      [
        2,
        10
      ]
    ]
  },
  {
    "id": 69,
    "stage": 14,
    "step": 4,
    "size": 11,
    "seed": 3678091290,
    "quality": 230,
    "pairs": 10,
    "limitSec": 478,
    "blocked": [
      [
        5,
        1
      ],
      [
        6,
        1
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        5,
        2
      ],
      [
        6,
        2
      ],
      [
        7,
        2
      ],
      [
        5,
        3
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        5,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        4,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ],
      [
        3,
        8
      ],
      [
        4,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        2,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ]
    ]
  },
  {
    "id": 70,
    "stage": 14,
    "step": 5,
    "size": 11,
    "seed": 1157823643,
    "quality": 231,
    "pairs": 9,
    "limitSec": 423,
    "blocked": [
      [
        0,
        2
      ],
      [
        0,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        4
      ],
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        9,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ],
      [
        3,
        6
      ],
      [
        8,
        6
      ],
      [
        9,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        2,
        7
      ],
      [
        3,
        7
      ],
      [
        8,
        7
      ],
      [
        9,
        7
      ],
      [
        2,
        8
      ],
      [
        8,
        8
      ],
      [
        9,
        8
      ],
      [
        7,
        9
      ],
      [
        8,
        9
      ],
      [
        9,
        9
      ],
      [
        7,
        10
      ],
      [
        8,
        10
      ],
      [
        9,
        10
      ]
    ]
  },
  {
    "id": 71,
    "stage": 15,
    "step": 1,
    "size": 11,
    "seed": 3302023571,
    "quality": 231,
    "pairs": 11,
    "limitSec": null,
    "blocked": [
      [
        0,
        0
      ],
      [
        1,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        1,
        2
      ],
      [
        0,
        3
      ],
      [
        1,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        4
      ],
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        7,
        7
      ],
      [
        8,
        7
      ],
      [
        0,
        8
      ],
      [
        7,
        8
      ],
      [
        7,
        9
      ],
      [
        8,
        9
      ],
      [
        9,
        9
      ],
      [
        7,
        10
      ],
      [
        8,
        10
      ],
      [
        9,
        10
      ]
    ]
  },
  {
    "id": 72,
    "stage": 15,
    "step": 2,
    "size": 11,
    "seed": 3370717870,
    "quality": 232,
    "pairs": 12,
    "limitSec": 570,
    "blocked": [
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        8,
        2
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        9,
        3
      ],
      [
        10,
        3
      ],
      [
        9,
        4
      ],
      [
        10,
        4
      ],
      [
        0,
        5
      ],
      [
        1,
        5
      ],
      [
        0,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ]
    ]
  },
  {
    "id": 73,
    "stage": 15,
    "step": 3,
    "size": 11,
    "seed": 3099538027,
    "quality": 233,
    "pairs": 12,
    "limitSec": 515,
    "blocked": [
      [
        7,
        0
      ],
      [
        8,
        0
      ],
      [
        9,
        0
      ],
      [
        10,
        0
      ],
      [
        7,
        1
      ],
      [
        8,
        1
      ],
      [
        9,
        1
      ],
      [
        10,
        1
      ],
      [
        7,
        2
      ],
      [
        9,
        2
      ],
      [
        10,
        2
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        1,
        4
      ],
      [
        2,
        4
      ],
      [
        4,
        4
      ],
      [
        5,
        4
      ],
      [
        6,
        4
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        3,
        5
      ],
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        6,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ]
    ]
  },
  {
    "id": 74,
    "stage": 15,
    "step": 4,
    "size": 11,
    "seed": 2935101950,
    "quality": 234,
    "pairs": 9,
    "limitSec": 460,
    "blocked": [
      [
        5,
        0
      ],
      [
        6,
        0
      ],
      [
        6,
        1
      ],
      [
        6,
        2
      ],
      [
        7,
        2
      ],
      [
        6,
        3
      ],
      [
        7,
        3
      ],
      [
        6,
        4
      ],
      [
        7,
        4
      ],
      [
        8,
        4
      ],
      [
        1,
        5
      ],
      [
        2,
        5
      ],
      [
        3,
        5
      ],
      [
        4,
        5
      ],
      [
        5,
        5
      ],
      [
        0,
        6
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ],
      [
        3,
        6
      ],
      [
        4,
        6
      ],
      [
        5,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        4,
        7
      ],
      [
        5,
        7
      ],
      [
        5,
        8
      ]
    ]
  },
  {
    "id": 75,
    "stage": 15,
    "step": 5,
    "size": 11,
    "seed": 1500052663,
    "quality": 235,
    "pairs": 10,
    "limitSec": 405,
    "blocked": [
      [
        10,
        2
      ],
      [
        8,
        3
      ],
      [
        9,
        3
      ],
      [
        10,
        3
      ],
      [
        8,
        4
      ],
      [
        9,
        4
      ],
      [
        10,
        4
      ],
      [
        8,
        5
      ],
      [
        9,
        5
      ],
      [
        10,
        5
      ],
      [
        8,
        6
      ],
      [
        9,
        6
      ],
      [
        0,
        7
      ],
      [
        1,
        7
      ],
      [
        2,
        7
      ],
      [
        3,
        7
      ],
      [
        4,
        7
      ],
      [
        0,
        8
      ],
      [
        1,
        8
      ],
      [
        2,
        8
      ],
      [
        3,
        8
      ],
      [
        4,
        8
      ],
      [
        0,
        9
      ],
      [
        1,
        9
      ],
      [
        0,
        10
      ],
      [
        1,
        10
      ]
    ]
  }
];
const COMPLETION={5:2,7:3,9:4,11:5};
const STAGE_BONUS=5;
const COST=10;
const BY_ID=new Map(ITEMS.map(x=>[x.id,x]));
function get(id){return BY_ID.get(Number(id))||null;}
function stageItems(stage){return ITEMS.filter(x=>x.stage===Number(stage));}
function initial(){return {version:1,completed:{},best:{},ledger:[],credits:0,spend:{},firstAttemptFailed:{}};}
function normalize(data){
 const p=data&&data.version===1?data:initial();
 p.completed ||= {};p.best ||= {};p.ledger ||= [];p.spend ||= {};p.firstAttemptFailed ||= {};
 // Derive credits entirely from the ledger to avoid drift. Still only a
 // LOCAL prototype, not suitable for paid balances or anti-cheat protection.
 p.credits=p.ledger.reduce((sum,e)=>sum+Number(e.amount||0),0);
 return p;
}
function unlocked(progress,id){
 const p=normalize(progress),item=get(id);
 return !!item && (item.id===1 || !!p.completed[item.id-1]);
}
// A level puzzle's first attempt remains open when it is paused, backgrounded,
// or extended with credits. Choosing Retry after time expires ends that first
// attempt. Later successful completions still unlock progression but no longer
// earn the puzzle's completion reward. Legacy v0.5.0 rewards stay untouched.
function forfeitFirstAttempt(progress,id){
 const p=normalize(progress),item=get(id);
 if(!item||p.completed[id]||p.firstAttemptFailed[id])return false;
 p.firstAttemptFailed[id]=true;
 return true;
}
function record(progress,id,timeMs,moves,hints){
 const p=normalize(progress),item=get(id);
 if(!item||!unlocked(p,id))return {accepted:false,earned:0,stageBonus:0};
 const before=p.best[id];
 if(!before||timeMs<before.elapsedMs)p.best[id]={elapsedMs:timeMs,moves,hints};
 if(p.completed[id])return {accepted:true,first:false,earned:0,stageBonus:0};
 p.completed[id]=true;
 const firstAttempt=!p.firstAttemptFailed[id];
 const earned=firstAttempt?COMPLETION[item.size]:0;
 if(earned)p.ledger.push({id:'complete:'+id,amount:earned,type:'completion',puzzleId:id});
 let stageBonus=0;
 if(stageItems(item.stage).every(v=>p.completed[v.id])&&!p.ledger.some(x=>x.id==='stage:'+item.stage)) {
  stageBonus=STAGE_BONUS;p.ledger.push({id:'stage:'+item.stage,amount:stageBonus,type:'stage',stage:item.stage});
 }
 p.credits+=earned+stageBonus;
 return {accepted:true,first:true,firstAttempt,earned,stageBonus};
}
function spend(progress,amount,kind,attemptId){
 const p=normalize(progress),cost=Number(amount);
 if(cost!==COST||p.credits<cost||!['hint','extra-time'].includes(kind)||!attemptId)return false;
 const history=p.spend[attemptId] ||= {hint:0,'extra-time':0};
 if(kind==='extra-time'&&history['extra-time']>=2)return false;
 history[kind]++;
 p.ledger.push({id:'spend:'+attemptId+':'+kind+':'+history[kind],amount:-cost,type:kind,attemptId});
 p.credits-=cost;
 return true;
}
const CATALOG_VERSION='dottrails-75-v0.7';
// The first 35 puzzles intentionally retain their original boards. Obstacles
// appear only in later Hard and Expert levels; original ids/seeds are stable.
const BLOCKED_FIRST=36;
const api={CATALOG_VERSION,BLOCKED_FIRST,ITEMS,COMPLETION,STAGE_BONUS,COST,get,stageItems,initial,normalize,unlocked,forfeitFirstAttempt,record,spend};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GridLevels=api;
})(typeof globalThis==='object'?globalThis:this);
