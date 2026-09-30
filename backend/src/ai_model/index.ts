import { documentExtractor } from './document_extractor.js';
import { featureBuilder } from './feature_builder.js';
import { creditScorer } from './credit_scorer.js';
import { explainabilityEngine } from './explainability_engine.js';
import {
  ExtractedApplicationForm,
  ExtractedOfftakeAgreement,
  AggregatedCreditFeatures,
  CreditAssessmentResult,
} from './schemas.js';

export interface AssessCooperativeLoanOptions {
  applicationDocument: Buffer | string;
  applicationMimeType?: string;
  offtakeDocument?: Buffer | string;
  offtakeMimeType?: string;
  preExtractedApplication?: ExtractedApplicationForm;
  preExtractedOfftake?: ExtractedOfftakeAgreement;
}

export interface CooperativeLoanAssessmentResponse {
  extractedApplication: ExtractedApplicationForm;
  extractedOfftake?: ExtractedOfftakeAgreement;
  features: AggregatedCreditFeatures;
  assessment: CreditAssessmentResult;
  formattedNarrativeProof: string;
}

/**
 * End to end pipeline: Extract Documents -> Blend with Database Records -> Score out of 100% -> Generate Chronological Proof
 */
export async function assessCooperativeLoan(
  options: AssessCooperativeLoanOptions
): Promise<CooperativeLoanAssessmentResponse> {
  // 1. Extract application form (or use pre-extracted data)
  const application =
    options.preExtractedApplication ||
    (await documentExtractor.extractApplicationForm(
      options.applicationDocument,
      options.applicationMimeType || 'text/plain'
    ));

  // 2. Extract offtake agreement if provided or embedded in application
  let offtake: ExtractedOfftakeAgreement | undefined = options.preExtractedOfftake;
  if (!offtake && options.offtakeDocument) {
    offtake = await documentExtractor.extractOfftakeAgreement(
      options.offtakeDocument,
      options.offtakeMimeType || 'text/plain'
    );
  } else if (!offtake && options.applicationDocument) {
    const appDocStr =
      typeof options.applicationDocument === 'string'
        ? options.applicationDocument
        : options.applicationDocument.toString('utf-8');
    const lowerApp = appDocStr.toLowerCase();
    if (
      lowerApp.includes('off-take') ||
      lowerApp.includes('offtake') ||
      lowerApp.includes('abc trade') ||
      lowerApp.includes('africa improved foods') ||
      lowerApp.includes('contracted volume')
    ) {
      try {
        offtake = await documentExtractor.extractOfftakeAgreement(
          options.applicationDocument,
          options.applicationMimeType || 'text/plain'
        );
      } catch (err) {
        console.warn('Could not extract embedded offtake from application document:', err);
      }
    }
  }

  // 3. Blend extracted document terms with PostgreSQL institutional records
  const features = await featureBuilder.buildFeatures(application, offtake || null);

  // 4. Calculate calibrated credit score out of 100%
  const assessment = creditScorer.calculateCreditScore(features);

  // 5. Generate rich chronological proof explanation in easy English
  const formattedNarrativeProof = explainabilityEngine.generateDetailedProofExplanation(
    features,
    assessment
  );

  return {
    extractedApplication: application,
    extractedOfftake: offtake,
    features,
    assessment,
    formattedNarrativeProof,
  };
}

export * from './schemas.js';
export { documentExtractor, featureBuilder, creditScorer, explainabilityEngine };
