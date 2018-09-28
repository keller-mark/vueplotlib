import CategoricalScale from '../../src/scales/CategoricalScale';

test('able to create a CategoricalScale', () => {
    let scale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(scale.id).toBe("sample_id");
    expect(scale.name).toBe("Samples");
    expect(scale.domain.length).toBe(6);
    expect(scale.domainFiltered.length).toBe(6);
});
