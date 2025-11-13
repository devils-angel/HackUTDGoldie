import {
  getLoanApplicationRow,
  getLoanApplicationByApplicationId,
  updateLoanApplicationById,
  updateLoanFinalStatus,
  creditBankAccountBalance
} from "./loanService.js";

const VALID_REGIONS = ["APAC", "EMEA", "AMERICAS", "MEA", "NA", "SA", "EU", "ASIA"];

const nowIso = () => new Date().toISOString();

class VerificationService {
  static async performKyc(application) {
    const remarks = [];
    let approved = true;

    if (!application.email.includes("@") || !application.email.includes(".")) {
      remarks.push("Invalid email format");
      approved = false;
    } else {
      remarks.push("Email format valid");
    }

    if (application.phone && application.phone.replace(/\D/g, "").length < 10) {
      remarks.push("Phone number too short");
      approved = false;
    } else {
      remarks.push("Phone number valid");
    }

    if (!application.documents_uploaded) {
      remarks.push("Required documents not uploaded");
      approved = false;
    } else {
      remarks.push("Documents uploaded and verified");
    }

    if (!application.name || application.name.trim().length < 3) {
      remarks.push("Invalid name");
      approved = false;
    } else {
      remarks.push("Name verified");
    }

    if (!VALID_REGIONS.includes((application.region || "").toUpperCase())) {
      remarks.push(`Invalid region: ${application.region}`);
      approved = false;
    } else {
      remarks.push(`Region verified: ${application.region}`);
    }

    await updateLoanFinalStatus(application.id, approved ? "APPROVED" : "REJECTED");
    await updateLoanApplicationById(application.id, {
      kyc_status: approved ? "APPROVED" : "REJECTED",
      kyc_verified_at: nowIso(),
      kyc_remarks: remarks.join("; ")
    });

    return approved;
  }

  static async performComplianceCheck(application) {
    const remarks = [];
    let approved = true;

    const politicalConnectionDetected = Math.random() < 0.1;
    const seniorRelativeIndicators = ["jr", "sr", "ceo", "cfo", "director"];
    const seniorRelativeDetected = seniorRelativeIndicators.some((indicator) =>
      (application.name || "").toLowerCase().includes(indicator)
    );
    const sanctionedDomains = ["sanctioned.com", "blocked.net", "restricted.org"];
    const emailDomain = application.email?.split("@")[1] || "";
    const highRiskCountries = ["Country-X", "Country-Y"];

    if (politicalConnectionDetected) {
      remarks.push("Political connection detected - requires manual review");
      approved = false;
    } else {
      remarks.push("No political connections found");
    }

    if (seniorRelativeDetected) {
      remarks.push("Potential senior employee relative - requires verification");
      approved = false;
    } else {
      remarks.push("No senior employee relation detected");
    }

    if (sanctionedDomains.includes(emailDomain)) {
      remarks.push(`Email domain on sanctions list: ${emailDomain}`);
      approved = false;
    } else {
      remarks.push("Email domain cleared");
    }

    if (highRiskCountries.includes(application.country)) {
      remarks.push(`High-risk country: ${application.country}`);
      approved = false;
    } else {
      remarks.push("Country risk assessment: CLEAR");
    }

    if (application.loan_amount > 500000) {
      remarks.push(
        `High-value transaction ($${Number(application.loan_amount).toLocaleString()}) - enhanced due diligence required`
      );
    }

    await updateLoanApplicationById(application.id, {
      compliance_status: approved ? "APPROVED" : "REJECTED",
      compliance_verified_at: nowIso(),
      compliance_remarks: remarks.join("; "),
      political_connection: politicalConnectionDetected,
      senior_relative: seniorRelativeDetected
    });

    return approved;
  }

  static async performEligibilityCheck(application) {
    const remarks = [];
    let approved = true;

    if (application.income > 0) {
      const dtiRatio = Number(application.debt) / Number(application.income);
      if (dtiRatio >= 0.4) {
        remarks.push(`High DTI ratio: ${(dtiRatio * 100).toFixed(1)}% (threshold: 40%)`);
        approved = false;
      } else {
        remarks.push(`DTI ratio acceptable: ${(dtiRatio * 100).toFixed(1)}%`);
      }
      await updateLoanApplicationById(application.id, { dti_ratio: dtiRatio });
    } else {
      remarks.push("Invalid income value");
      approved = false;
    }

    if (application.credit_score < 650) {
      remarks.push(
        `Credit score below minimum: ${application.credit_score} (minimum: 650)`
      );
      approved = false;
    } else if (application.credit_score < 700) {
      remarks.push(`Credit score marginal: ${application.credit_score}`);
    } else {
      remarks.push(`Credit score good: ${application.credit_score}`);
    }

    if (Number(application.income) * 3 < Number(application.loan_amount)) {
      remarks.push(
        `Insufficient income for loan amount (Income: $${Number(application.income).toLocaleString()}, Loan: $${Number(
          application.loan_amount
        ).toLocaleString()})`
      );
      approved = false;
    } else {
      remarks.push("Income sufficient for requested loan amount");
    }

    if (application.loan_amount > 1_000_000) {
      remarks.push(
        `Loan amount exceeds maximum: $${Number(application.loan_amount).toLocaleString()} (max: $1,000,000)`
      );
      approved = false;
    }

    if (application.income < 30000) {
      remarks.push(
        `Income below minimum requirement: $${Number(application.income).toLocaleString()} (min: $30,000)`
      );
      approved = false;
    }

    await updateLoanApplicationById(application.id, {
      eligibility_status: approved ? "APPROVED" : "REJECTED",
      eligibility_verified_at: nowIso(),
      eligibility_remarks: remarks.join("; ")
    });

    return approved;
  }

  static async finalizeApplication(application) {
    const approved =
      application.kyc_status === "APPROVED" &&
      application.compliance_status === "APPROVED" &&
      application.eligibility_status === "APPROVED";

    const failedChecks = [];
    if (application.kyc_status !== "APPROVED") failedChecks.push("KYC");
    if (application.compliance_status !== "APPROVED") failedChecks.push("Compliance");
    if (application.eligibility_status !== "APPROVED") failedChecks.push("Eligibility");

    await updateLoanFinalStatus(
      application.id,
      approved ? "APPROVED" : "REJECTED"
    );
    await updateLoanApplicationById(application.id, {
      final_decision_at: nowIso(),
      final_remarks: approved
        ? "All verification checks passed. Loan application approved."
        : `Loan application rejected. Failed checks: ${failedChecks.join(", ")}`
    });

    if (
      approved &&
      application.bank_account_id &&
      Number(application.loan_amount) > 0
    ) {
      await creditBankAccountBalance(
        application.bank_account_id,
        Number(application.loan_amount)
      );
    }

    return approved;
  }

  static async sendNotification(application) {
    console.log(
      `[NOTIFY] Application ${application.application_id} ${application.final_status} for ${application.name}`
    );
    await updateLoanApplicationById(application.id, {
      alert_sent: true,
      email_sent: true
    });
  }

  static async markFailure(application, message) {
    await updateLoanApplicationById(application.id, {
      final_status: "REJECTED",
      final_remarks: message,
      final_decision_at: nowIso(),
      review_status: "REJECTED"
    });
    const latest = await getLoanApplicationByApplicationId(application.application_id);
    await this.sendNotification(latest);
  }

  static async processApplication(applicationId) {
    let application = await getLoanApplicationRow(applicationId);
    if (!application) {
      console.warn(`[Workflow] Application ${applicationId} not found`);
      return false;
    }

    if (!(await this.performKyc(application))) {
      await this.markFailure(application, "Application rejected at KYC stage");
      return false;
    }
    application = await getLoanApplicationRow(applicationId);

    if (!(await this.performComplianceCheck(application))) {
      await this.markFailure(application, "Application rejected at compliance stage");
      return false;
    }
    application = await getLoanApplicationRow(applicationId);

    if (!(await this.performEligibilityCheck(application))) {
      await this.markFailure(application, "Application rejected at eligibility stage");
      return false;
    }
    application = await getLoanApplicationRow(applicationId);

    const approved = await this.finalizeApplication(application);
    application = await getLoanApplicationByApplicationId(applicationId);
    await this.sendNotification(application);
    return approved;
  }
}

export default VerificationService;
