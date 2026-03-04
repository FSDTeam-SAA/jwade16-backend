import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { OpenAiService } from '../../openai.service';

interface ScoreRange {
  min: number;
  max: number;
}

interface FreeReportTier {
  label: string;
  score_range: ScoreRange;
  description: string;
  recommended_actions: string[];
}

interface PaidReportTier {
  label: string;
  score_range: string;
  what_this_means: string;
  typical_signs: string[];
  common_mistake: string;
  long_term_consequence: string;
  what_moves_the_score: string[];
  strategic_next_step: string;
}

interface PayPowerData {
  meta: {
    score_range: ScoreRange & { type: string };
    display_rules: {
      always_show_numeric_score: boolean;
      always_show_label: boolean;
      inclusive_bounds: boolean;
    };
    language_constraints: {
      disallowed_terms: string[];
      preferred_terms: string[];
    };
  };
  free_report: {
    headline: { format: string };
    supporting_line: string;
    tiers: {
      strong: FreeReportTier;
      moderate: FreeReportTier;
      weak: FreeReportTier;
    };
    global_disclaimer: string;
  };
  paid_report: {
    title: string;
    subtitle: string;
    intro: string;
    tiers: {
      strong: PaidReportTier;
      moderate: PaidReportTier;
      weak: PaidReportTier;
    };
  };
}

@Injectable()
export class PaypowerService {
  private readonly paypowerData: PayPowerData;

  constructor(private readonly openAiService: OpenAiService) {
    const filePath = path.join(process.cwd(), 'paypowerScoreContent.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    this.paypowerData = JSON.parse(fileContent) as PayPowerData;
  }

  private getTierLabel(score: number): 'weak' | 'moderate' | 'strong' | null {
    const tiers = this.paypowerData.free_report.tiers;
    const matched = (Object.keys(tiers) as Array<keyof typeof tiers>).find(
      (key) => {
        const range = tiers[key].score_range;
        return score >= range.min && score <= range.max;
      },
    );
    return matched ?? null;
  }

  async getPaypowerReport(
    score: number,
    answers?: unknown,
  ): Promise<Record<string, unknown> | null> {
    const tierLabel = this.getTierLabel(score);
    if (!tierLabel) {
      return null;
    }

    const freeReport = this.paypowerData.free_report;
    const tierCopy = freeReport.tiers[tierLabel];

    if (!tierCopy) {
      return null;
    }

    let personalizedExplanation: string;
    try {
      personalizedExplanation =
        await this.openAiService.generatePersonalizedPaypowerExplanation({
          score,
          tierLabel,
          baseDescription: tierCopy.description,
          recommendedActions: tierCopy.recommended_actions,
          answers,
        });
    } catch {
      personalizedExplanation =
        `${tierCopy.description} Focus first on this step: ${tierCopy.recommended_actions[0] ?? 'Review your current compensation signals and document your next improvement action.'}`.trim();
    }

    return {
      score,
      label: tierCopy.label,
      headline: freeReport.headline.format.replace(
        '{{tier}}',
        tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1),
      ),
      supportingLine: freeReport.supporting_line.replace(
        '{{score}}',
        score.toString(),
      ),
      description: personalizedExplanation,
      staticDescription: tierCopy.description,
      recommendedActions: tierCopy.recommended_actions,
      disclaimer: freeReport.global_disclaimer,
      personalized: true,
    };
  }

  getPaidReport(score: number) {
    const tierLabel = this.getTierLabel(score);
    if (!tierLabel) {
      return null;
    }

    const paidReport = this.paypowerData.paid_report;
    const tierBreakdown = paidReport.tiers[tierLabel];

    if (!tierBreakdown) {
      return null;
    }

    return {
      score,
      label: tierBreakdown.label,
      title: paidReport.title,
      description: paidReport.intro,
      subtitle: paidReport.subtitle,
      breakdown: tierBreakdown,
      disclaimer: this.paypowerData.free_report.global_disclaimer,
    };
  }
}
