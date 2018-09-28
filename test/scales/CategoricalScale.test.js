import CategoricalScale from '../../src/scales/CategoricalScale';

test('able to create a CategoricalScale', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.id).toBe("sample_id");
    expect(scale.name).toBe("Samples");
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(6);
});


test('able to get a color from a CategoricalScale', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.color("S1").substring(0, 3)).toBe("rgb");
});

test('able to compare two CategoricalScale domain values', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.comparator("S2", "S3")).toBe(1);
    expect(scale.comparator("S4", "S3")).toBe(-1);
});

test('able to zoom a CategoricalScale', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(6);
    scale.zoom(1, 3)
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(3);
});

test('able to filter a CategoricalScale', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(6);
    scale.filter([1, 2])
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(2);
});