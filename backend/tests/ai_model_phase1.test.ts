import { describe, it, expect } from 'vitest';
import { documentExtractor } from '../src/ai_model/document_extractor.js';
import { featureBuilder } from '../src/ai_model/feature_builder.js';

describe('Phase 1: Core AI Model Extraction & Feature Builder', () => {
  it('extracts structured application form data from raw text/document', async () => {
    const rawFormText = `
      BANK OF KIGALI AGRICULTURAL LOAN APPLICATION
      Cooperative Name: Koperative Twitezimbere Gasabo
      TIN: 100234567
      Registration: RCA/GAS/2018/001
      Sector: Bumbogo
      Requested Amount: 25,000,000 RWF
      Tenor: 6 months
      Crop Type: Maize
      Purpose: Seasonal input financing and grain aggregation for Season 2026A
      Cultivated Farmland: 85.5 hectares
      Member Farmers: 145
    `;

    const extracted = await documentExtractor.extractApplicationForm(rawFormText);

    expect(extracted.cooperativeName).toBe('Koperative Twitezimbere Gasabo');
    expect(extracted.tin).toBe('100234567');
    expect(extracted.sector).toBe('Bumbogo');
    expect(extracted.requestedAmountRwf).toBe(25000000);
    expect(extracted.tenorMonths).toBe(6);
    expect(extracted.cultivatedHectares).toBe(85.5);
    expect(extracted.documentConfidence).toBeGreaterThan(0.9);
  }, 30000);

  it('extracts structured commercial off-take agreement parameters', async () => {
    const rawContractText = `
      COMMERCIAL GRAIN PURCHASE AGREEMENT
      Buyer: Africa Improved Foods (AIF)
      Contracted Quantity: 350,000 kg
      Agreed Purchase Price: 420 RWF per kg
      Valid From: 2026-03-01 To: 2026-08-31
      Quality: Grade 1 Yellow Maize
    `;

    const extracted = await documentExtractor.extractOfftakeAgreement(rawContractText);

    expect(extracted.buyerName).toContain('Africa Improved Foods');
    expect(extracted.contractedVolumeKg).toBe(350000);
    expect(extracted.agreedPriceRwfKg).toBe(420);
    expect(extracted.totalContractValueRwf).toBe(350000 * 420);
    expect(extracted.isVerified).toBe(true);
  }, 30000);

  it('extracts embedded off-take agreement from application section text', async () => {
    const sectionText = `
      3. Agronomic Productive Capacity & Repayment Guarantee
      Total Cultivated Farmland Area: 85.5 Hectares under active maize cultivation in Bumbogo marshlands
      Consolidated Storage & Drying Capacity: 120 Metric Tons dedicated aerated brick warehouse with moisture meters
      Historical Average Seasonal Yield: 4,200 Kilograms per Hectare (Estimated Gross Output: 359,100 KG)
      Audited Institutional Record Rating: 95 / 100 on official RCA Audit and digital ledger system
      Primary Forward Off-Take Partner: ABC Trade Ltd (Binding contract for 100,000 KG at RWF 420/KG = RWF 42,000,000)
    `;

    const extracted = await documentExtractor.extractOfftakeAgreement(sectionText);

    expect(extracted.buyerName).toBe('ABC Trade Ltd');
    expect(extracted.contractedVolumeKg).toBe(100000);
    expect(extracted.agreedPriceRwfKg).toBe(420);
    expect(extracted.totalContractValueRwf).toBe(42000000);
  }, 30000);

  it('aggregates document features with PostgreSQL records and generates chronological proof timeline', async () => {
    const application = {
      cooperativeName: 'Koperative Twitezimbere Gasabo',
      tin: '100234567',
      registrationNo: 'RCA/GAS/2018/001',
      sector: 'Bumbogo',
      requestedAmountRwf: 25000000,
      tenorMonths: 6,
      cropType: 'Maize',
      purpose: 'Seasonal input financing and aggregation for Season 2026A',
      cultivatedHectares: 85.5,
      memberFarmers: 145,
      projectedHarvestTons: 359,
      documentConfidence: 0.98,
    };

    const offtake = {
      buyerName: 'Africa Improved Foods (AIF)',
      buyerTin: '100099887',
      contractedVolumeKg: 350000,
      agreedPriceRwfKg: 420,
      totalContractValueRwf: 147000000,
      startDate: '2026-03-01',
      endDate: '2026-08-31',
      isVerified: true,
      documentConfidence: 0.96,
    };

    const features = await featureBuilder.buildFeatures(application, offtake);

    expect(features.cooperativeName).toBe('Koperative Twitezimbere Gasabo');
    expect(features.tin).toBe('100234567');
    expect(features.facilitiesCount).toBeGreaterThan(0);
    expect(features.onTimeRepaymentRatio).toBe(1.0);
    expect(features.maxDaysPastDue).toBe(0);
    expect(features.hasVerifiedOfftakeContract).toBe(true);
    expect(features.chronologicalProofEvents.length).toBeGreaterThan(0);

    // Verify detailed chronological proof events
    const descriptions = features.chronologicalProofEvents.map((e) => e.description);
    const hasLoanDisbursedProof = descriptions.some((d) => d.includes('borrowed') || d.includes('secured a seasonal loan'));
    const hasRepaidProof = descriptions.some((d) => d.includes('paid their scheduled installment'));
    const hasGrainSaleProof = descriptions.some((d) => d.includes('grain sale'));

    expect(hasLoanDisbursedProof).toBe(true);
    expect(hasRepaidProof).toBe(true);
    expect(hasGrainSaleProof).toBe(true);
  });
});
