// Map 1: Serpentine Path
// 20 columns x 11 rows
// Path enters from left, winds through the map, exits right

export const map1 = {
    id: "map1",
    name: "Serpentine Valley",
    cols: 20,
    rows: 11,
    // P=path, B=buildable, X=blocked
    grid: [
        "XBBBBBBBBXBBBBBBBBBB",
        "XBBBBBBBBXBBBBBBBBBB",
        "PPPPPBBBBXBBBBBPPPPP",
        "BBBBPBBBBXBBBBBPBBBB",
        "BBBBPBBBBBBBBBBPBBBB",
        "BBBBPPPPPPPPPPPPBBBB",
        "BBBBBBBBBBBBBBBXBBBB",
        "BBBPPPPPPPPPBBBXBBBB",
        "BBBPBBBBBBBPBBBXBBBB",
        "BBBPBBBBBBBPPPPXBBBB",
        "XXXPBBBBBBBBBBBXBBBB",
    ],
    // Path waypoints in tile coords [col, row], ordered start->end
    path: [
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
        [4, 3], [4, 4], [4, 5],
        [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
        [14, 4], [14, 3], [14, 2],
        [15, 2], [16, 2], [17, 2], [18, 2], [19, 2],
    ],
    // Also define a second branch for variety — the lower path
    // Actually let's keep it simple with one winding path
    pathAlt: [
        // Enemies can also come from below on wave 5+
        [3, 10], [3, 9], [3, 8], [3, 7],
        [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
        [11, 7], [11, 8], [11, 9],
        [12, 9], [13, 9], [14, 9],
    ],
    corePosition: { col: 19, row: 2 },  // Knowledge Core at end of main path
    spawnPoints: [
        { col: 0, row: 2, pathId: "main" },
    ],
};
