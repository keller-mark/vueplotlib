import GenomeScale from '../../src/scales/GenomeScale';

test('able to create a GenomeScale', () => {
    let scale = new GenomeScale('genome', 'Genome');
    expect(scale.id).toBe("genome");
    expect(scale.name).toBe("Genome");
    expect(scale.getDomains().length).toBe(25);
    expect(scale.getDomain("2")[0]).toBe(0);
    expect(scale.getDomain("2")[1]).toBe(243199373);
    expect(scale.convertPositionToRatio("1", 2000)).toBe(6.460586902268111e-7);
    expect(scale.convertPositionToRatioFiltered("1", 2000)).toBe(6.460586902268111e-7);
    expect(scale.convertPositionToRatio("5", 3000)).toBe(0.2847922646235282);
    expect(scale.convertPositionToRatioFiltered("5", 3000)).toBe(0.2847922646235282);

});
