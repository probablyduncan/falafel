import sortFalafel, { type FalafelPlaceSortDto } from "../src/lib/sortFalafel";

// so this sorting should work like so:
// all entries with dateSaved AFTER migration date should use dateEaten if set, otherwise dateSaved should be used as dateEaten
// all entries with dateSaved BEFORE migration date should be dateEaten if set, or slotted in dateSaved order between the nearest entries with dateEaten set

// if I have a post-migration backdate to pre-migration, where do I put it relative to non-dated pre-migration ones?
// I guess it should go after undated ones, instead of splitting a group or something

// so pre-migration, to get eatDate, I should find the most recent eatdate saved before it?
// what if there's some mismatch in eatdate ordering? there won't be, I don't have to worry about that?


function test(name: string, testDataBefore: FalafelPlaceSortDto[]) {

    const orderHashBefore = testDataBefore.map(p => p.dateSaved).join("|");
    const testDataAfter = sortFalafel([...testDataBefore]);
    const orderHashAfter = testDataAfter.map(p => p.dateSaved).join("|");

    console.log("\n---\n\n" + name);
    if (orderHashBefore === orderHashAfter) {
        console.log("success?");
    }
    else {
        console.log("error?");
        console.log("before:", JSON.stringify(testDataBefore, null, 2));
        console.log("after:", JSON.stringify(testDataAfter, null, 2));
    }
}

const t1_allAfter: FalafelPlaceSortDto[] = [
    {
        // after migration date, backdated a little bit
        dateEaten: "",
        dateSaved: "2026-05-12",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "",
        dateSaved: "2026-05-02",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "2026-05-01",
        dateSaved: "2026-05-03",
    },
    {
        // after migration date, assume eat date
        dateEaten: "",
        dateSaved: "2026-04-15",
    },
    {
        // backdated but not as much as other one?
        dateEaten: "2026-04-03",
        dateSaved: "2026-04-04",
    },
    {
        dateEaten: "",
        dateSaved: "2026-04-02",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "2026-04-01",
        dateSaved: "2026-04-05",
    },
];

const t2_allBefore: FalafelPlaceSortDto[] = [
    {
        dateEaten: "",
        dateSaved: "2026-02-21",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-20",
    },
    {
        dateEaten: "2025-08-15",
        dateSaved: "2026-02-19",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-18",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-17",
    },
    {
        dateEaten: "2025-05-15",
        dateSaved: "2026-02-16",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-15",
    },
];

const t3_mostlyBefore: FalafelPlaceSortDto[] = [
    {
        dateEaten: "",
        dateSaved: "2026-02-21",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-20",
    },
    {
        dateEaten: "2025-08-15",
        dateSaved: "2026-02-19",
    },
    {
        // saved recently, backdated a long time ago
        // it should be more recent than the other ones in this group
        dateEaten: "2025-08-12",
        dateSaved: "2026-05-01",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-18",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-17",
    },
    {
        dateEaten: "2025-05-15",
        dateSaved: "2026-02-16",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-15",
    },
];

const t4_mix: FalafelPlaceSortDto[] = [
    {
        // after migration date, backdated a little bit
        dateEaten: "",
        dateSaved: "2026-05-12",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "",
        dateSaved: "2026-05-02",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "2026-05-01",
        dateSaved: "2026-05-03",
    },
    {
        // after migration date, assume eat date
        dateEaten: "",
        dateSaved: "2026-04-15",
    },
    {
        // backdated but not as much as other one?
        dateEaten: "2026-04-03",
        dateSaved: "2026-04-04",
    },
    {
        dateEaten: "",
        dateSaved: "2026-04-02",
    },
    {
        // after migration date, backdated a little bit
        dateEaten: "2026-04-01",
        dateSaved: "2026-04-05",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-21",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-20",
    },
    {
        dateEaten: "2025-08-15",
        dateSaved: "2026-02-19",
    },
    {
        // saved recently, backdated a long time ago
        // it should be more recent than the other ones in this group
        dateEaten: "2025-08-12",
        dateSaved: "2026-05-01",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-18",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-17",
    },
    {
        dateEaten: "2025-05-15",
        dateSaved: "2026-02-16",
    },
    {
        dateEaten: "",
        dateSaved: "2026-02-15",
    },
]



test("all after", t1_allAfter);
test("all before", t2_allBefore);
test("mostly before", t3_mostlyBefore);
test("mix", t4_mix);