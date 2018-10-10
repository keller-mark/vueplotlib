import GenomeScale from '../../src/scales/GenomeScale';

test('able to create a GenomeScale', () => {
    let scale = new GenomeScale('genome', 'Genome');
    expect(scale.id).toBe("genome");
    expect(scale.name).toBe("Genome");
    expect(scale.chromosomes.length).toBe(25);
    expect(scale.chromosomesFiltered.length).toBe(25);
});

test('able to get a GenomeScale domain', () => {
    let scale = new GenomeScale('genome', 'Genome');
    expect(scale.getDomains().length).toBe(25);
    expect(scale.getDomainsFiltered().length).toBe(25);
    expect(scale.getDomain("2")[0]).toBe(0);
    expect(scale.getDomain("2")[1]).toBe(243199373);
    expect(scale.getDomainFiltered("2")[0]).toBe(0);
    expect(scale.getDomainFiltered("2")[1]).toBe(243199373);
});

test('able to convert a genome position using GenomeScale', () => {
    let scale = new GenomeScale('genome', 'Genome');
    expect(scale.convertPositionToRatio("1", 2000)).toBe(6.460586902268111e-7);
    expect(scale.convertPositionToRatioFiltered("1", 2000)).toBe(6.460586902268111e-7);
    expect(scale.convertPositionToRatio("5", 3000)).toBe(0.2847922646235282);
    expect(scale.convertPositionToRatioFiltered("5", 3000)).toBe(0.2847922646235282);
});

test('able to get chromosome ratios using GenomeScale', () => {
    let scale = new GenomeScale('genome', 'Genome');
    expect(scale.getChromosomeRatios()[0]).toBe(0.08051526487073965);
    expect(scale.getChromosomeRatios()[3]).toBe(0.06174844059190718);

    expect(scale.getChromosomeRatiosFiltered()[0]).toBe(0.08051526487073965);
    expect(scale.getChromosomeRatiosFiltered()[3]).toBe(0.06174844059190718);

    expect(scale.getChromosomeRatiosCumulative()[0]).toBe(0.0);
    expect(scale.getChromosomeRatiosCumulative()[3]).toBe(0.22304285494358567);
    expect(scale.getChromosomeRatiosCumulative()[24]).toBeCloseTo(0.99999, 5);

    expect(scale.getChromosomeRatiosCumulativeFiltered()[0]).toBe(0.0);
    expect(scale.getChromosomeRatiosCumulativeFiltered()[3]).toBe(0.22304285494358567);
    expect(scale.getChromosomeRatiosCumulativeFiltered()[24]).toBeCloseTo(0.99999, 5);
});