export const map2 = {
    id: "map2",
    name: "Crossroads",
    cols: 20,
    rows: 11,
    grid: [
        "BBBBBBBBBBBBBBBBBBBB",
        "PPPPPPPPPBBBBBBPPPPP",
        "BBBBBBBBBBBBBBBPBBBB",
        "BBBBBBBBBBBBBBBPBBBB",
        "BBBBBBBBBBBBBBBPBBBB",
        "BBBBBBBPPPPPPPPPPBBB",
        "BBBBBBBPBBBBBBBBBBBB",
        "BBBBBBBPBBBBBBBBBBBB",
        "BBBBBBBPBBBBBBBBBBBB",
        "PPPPPPPPPBBBBBBBBBBB",
        "BBBBBBBBBBBBBBBBBBBB",
    ],
    path: [
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1],
        [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5],
        [15, 4], [15, 3], [15, 2], [15, 1],
        [16, 1], [17, 1], [18, 1], [19, 1],
    ],
    corePosition: { col: 19, row: 1 },
    spawnPoints: [
        { col: 0, row: 1, pathId: "main" },
    ],
};
