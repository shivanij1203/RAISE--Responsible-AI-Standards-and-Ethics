# RAISE rule sources: funders and journals

Generative AI rules for US university researchers, built for encoding as RAISE checklist items.

- Accessed: 2026-10-30 (all rows)
- Inclusion rule: a row appears only if its primary source page was opened this session and the quote came from that page.
- How quotes were captured: pages were read through a web fetch tool that returns text in chunks of up to 125 characters. Where one sentence came back in two or more chunks, the chunks are joined here in order. A "..." marks a gap where text was skipped. Spot-check quotes against the live page before shipping.
- Where a page shows no date, the table says so and gives the copyright year.

---

## 1. NIH

### NOT-OD-25-132: Supporting Fairness and Originality in NIH Research Applications

Release date July 17, 2025. Effective for the September 25, 2025 receipt date and later.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| nih_application_originality | Applicant, PI/PD, MPI | Do not submit an application, or any section of one, that AI substantially developed. NIH will not treat it as the applicant's original ideas. | None. The notice sets no disclosure requirement. | "NIH will not consider applications that are either substantially developed by AI, or contain sections substantially developed by AI, to be original ideas of applicants." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025 | 2026-10-30 |
| nih_ai_limited_use_allowed | Applicant, PI/PD | AI may help with limited parts of application preparation only. | None stated | "AI tools may be appropriate to assist in application preparation for limited aspects or in specific circumstances" | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025 | 2026-10-30 |
| nih_ai_misconduct_risk | Applicant, PI/PD | Check AI output for plagiarism and fabricated citations. These count as possible research misconduct. | None stated | "AI use may result in plagiarism, fabricated citations, or other kinds of research misconduct." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025 | 2026-10-30 |
| nih_application_limit_six | PI/PD, MPI | Submit no more than six new, renewal, resubmission, or revision applications per calendar year, across all council rounds. | None. RAISE should track the count. | "NIH will only accept six new, renewal, resubmission, or revision applications from an individual Principal Investigator/Program Director or Multiple Principal Investigator for all council rounds in a calendar year." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025; effective for Sept 25, 2025 receipt date and later | 2026-10-30 |
| nih_application_limit_exemptions | PI/PD, MPI | The six-application cap does not count T activity codes or R13 conference grants. | None | "This policy applies to all activity codes except T activity codes and R13 Conference Grant Applications." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025 | 2026-10-30 |
| nih_ai_detection_post_award | PI/PD, institution | NIH screens for AI-generated content. If it finds AI after an award, NIH may refer the case to ORI and take enforcement action, up to termination. | None | "If the detection of AI is identified post award, NIH may refer the matter to the Office of Research Integrity to determine whether there is research misconduct while simultaneously taking enforcement actions including but not limited to disallowing costs, withholding future awards, wholly or in part suspending the grant, and possible termination." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html | Released July 17, 2025 | 2026-10-30 |

### NIH Extramural Nexus: "Apply Responsibly" (plain-language summary of NOT-OD-25-132)

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| nih_ai_reduce_admin_burden_only | Applicant | AI use is acceptable in limited ways that cut administrative work. Keep originality and misconduct risks in mind. | The page does not address disclosure. | "applicants may use AI in limited aspects to reduce administrative burden while preparing applications." | https://www.grants.nih.gov/news-events/nih-extramural-nexus-news/2025/07/apply-responsibly-policy-on-ai-use-in-nih-research-applications-and-limiting-submissions-per-pi | July 31, 2025 | 2026-10-30 |

### NOT-OD-23-149: The Use of Generative Artificial Intelligence Technologies is Prohibited for the NIH Peer Review Process

Release date June 23, 2023. The notice gives no separate effective date.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| nih_review_no_genai_critiques | NIH peer reviewer | Do not use LLMs or other generative AI to analyze applications or write critiques. This covers grant applications and R&D contract proposals. | Not applicable | "the NIH prohibits NIH scientific peer reviewers from using natural language processors, large language models, or other generative Artificial Intelligence (AI) technologies for analyzing and formulating peer review critiques for grant applications and R&D contract proposals." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html | Released June 23, 2023 | 2026-10-30 |
| nih_review_no_upload_confidentiality | NIH peer reviewer | Do not upload or share any application, proposal, or critique content in online generative AI tools. Doing so breaks NIH confidentiality rules. | Not applicable | "Reviewers should be aware that uploading or sharing content or original concepts from an NIH grant application, contract proposal, or critique to online generative AI tools violates the NIH peer review confidentiality and integrity requirements." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html | Released June 23, 2023 | 2026-10-30 |
| nih_review_sign_nondisclosure | NIH peer reviewer | Sign the modified Security, Confidentiality and Nondisclosure Agreement before review. | Signed agreement submitted to NIH | "all NIH Peer Reviewers will be required to sign and submit a modified Security, Confidentiality and Nondisclosure Agreement certifying that they fully understand and will comply with the confidential nature of the review process" | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html | Released June 23, 2023 | 2026-10-30 |

### NOT-OD-25-081: Protecting Human Genomic Data when Developing Generative Artificial Intelligence Tools and Applications

Release date March 28, 2025. The notice gives no separate effective date. It covers controlled-access data under a Data Use Certification (DUC), such as data from dbGaP.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| nih_controlled_data_no_public_ai | Approved User of NIH controlled-access data (PI, staff, students on the Data Access Request) | Do not put controlled-access data into public or third-party generative AI tools through prompts or any other interface. | Not applicable | "sharing controlled-access data with public generative AI tools (e.g., third party tools) via prompts or other user interfaces is in violation of the provision on Non-Transferability, and by extension, the DUC." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-081.html | Released March 28, 2025 | 2026-10-30 |
| nih_controlled_data_model_is_derivative | Approved User | Treat any generative AI model trained on controlled-access data, including its parameters, as a Data Derivative under the DUC. | Not applicable | "NIH considers generative AI models, including model parameters, developed by Approved Users of controlled-access data to constitute Data Derivatives as defined in the DUC provision 14. Definitions." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-081.html | Released March 28, 2025 | 2026-10-30 |
| nih_controlled_data_model_sharing_limits | Approved User | You may build models on controlled-access data only with NIH approval. Share the model only with collaborators who are also Approved Users. Do not keep the model after project closeout. | Data Access Request / NIH approval | "Approved Users of controlled-access data may continue to develop generative AI models using the controlled-access data so long as the use is approved by NIH, but (1) may not share the model, including model parameters, except with collaborators who are also Approved Users and (2) may not retain the generative AI model, including model parameters, upon closeout of the project as instructed in provision 13. Termination and Data Destruction of the DUC." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-081.html | Released March 28, 2025 | 2026-10-30 |
| nih_controlled_data_no_distribution | Approved User | Do not give controlled-access data or derivatives to anyone outside your Data Access Request without NIH's written approval. | Not applicable | "prohibit users from distributing controlled-access data (including genomic or associated data) or their Data Derivatives to any entity or individual not identified in their Data Access Request without appropriate written approvals from the NIH." | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-081.html | Released March 28, 2025 | 2026-10-30 |

---

## 2. NSF

### Notice to Research Community: Use of Generative Artificial Intelligence Technology in the NSF Merit Review Process

Published December 14, 2023. Last updated May 21, 2026. The same text appears at two NSF URLs, and both were opened.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| nsf_review_no_upload_nonapproved_ai | NSF reviewer | Do not upload any proposal content, review information, or related records to non-approved generative AI tools. | Not applicable | "NSF reviewers are prohibited from uploading any content from proposals, review information and related records to non-approved generative AI tools." | https://www.nsf.gov/policies/ai/merit-review | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |
| nsf_review_confidentiality_violation | NSF reviewer | NSF treats an upload like this as a breach of its confidentiality pledge. | Not applicable | "If reviewers take this action, NSF will consider it a violation of the agency's confidentiality pledge and other applicable laws, regulations and policies." | https://www.nsf.gov/news/notice-to-the-research-community-on-ai | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |
| nsf_review_public_info_allowed | NSF reviewer | Reviewers may give generative AI tools publicly available information only. | Not applicable | "NSF reviewers may share publicly available information with current generation generative AI tools." | https://www.nsf.gov/news/notice-to-the-research-community-on-ai | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |
| nsf_proposal_ai_disclosure_encouraged | Proposer, PI | NSF encourages, but does not require, proposers to say whether and how they used generative AI. | Project description | "Proposers are encouraged to indicate in the project description the extent to which, if any, generative AI technology was used and how it was used to develop their proposal." | https://www.nsf.gov/policies/ai/merit-review | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |
| nsf_proposal_accuracy_responsibility | Proposer, PI | Proposers are responsible for the accuracy and authenticity of the whole proposal, including AI-assisted content. | None stated | "Proposers are responsible for the accuracy and authenticity of their proposal submission in consideration for merit review, including content developed with the assistance of generative AI tools." | https://www.nsf.gov/news/notice-to-the-research-community-on-ai | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |
| nsf_proposal_misconduct_risk | Proposer, awardee | Make sure AI use does not introduce fabrication, falsification, or plagiarism into the proposal or reported results. | None stated | "Generative AI tools may create these risks, and proposers and awardees are responsible for ensuring the integrity of their proposal and reporting of research results." | https://www.nsf.gov/policies/ai/merit-review | Dec 14, 2023; last updated May 21, 2026 | 2026-10-30 |

Note for RAISE: The May 2026 version also says "NSF will update the 2025 PAPPG to align with the requirements stipulated in this memorandum or with additional guidance and requirements as necessary." I did not open the current PAPPG, so check it for new AI language.

---

## 3. Journals and publishers

### ICMJE Recommendations, Section V (Artificial Intelligence)

The pages show no version date. The footer reads "© 2026 International Committee of Medical Journal Editors." This section appears to be new in the 2026 revision.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| icmje_ai_not_author | Author | Do not list chatbots or other AI tools as authors. | Not applicable | "Chatbots (such as ChatGPT) and other AI-assisted tools should not be listed as authors because they cannot be responsible for the accuracy, integrity, and originality of the work" | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_ai_disclosure_cover_letter_and_work | Author | Describe how you used AI in both the cover letter and the manuscript. | Cover letter and the relevant section of the manuscript | "Authors who use such technology should describe, in both the cover letter and the submitted work in the appropriate section if applicable, how they used it" | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_ai_human_review_output | Author | Review and edit AI output. Humans are responsible for everything submitted. | Not applicable | "Authors should carefully review and edit the AI-generated content as the output can be incorrect, incomplete, or biased." | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_ai_not_primary_source | Author | Do not cite AI-generated material as a primary source. Fully cite all quoted material. | References | "Referencing AI-generated material as the primary source is not acceptable." | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_ai_no_plagiarism_text_images | Author | Make sure AI-produced text and images contain no plagiarism. | Not applicable | "Authors should be able to assert that there is no plagiarism in their paper, including in text and images produced by the AI." | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_ai_nondisclosure_misconduct | Author | Failing to disclose AI use can lead to corrective action and may count as misconduct. | Not applicable | "Nondisclosure of AI use may require corrective action and may be construed as misconduct in some circumstances" | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html | No date on page; © 2026 | 2026-10-30 |
| icmje_review_follow_journal_ai_policy | Reviewer | Follow the journal's AI policy, or get the journal's permission before using AI on a review. | Request to the journal | "Reviewers must adhere to the journal's stated policy on the use of AI or request permission from the journal prior to using AI technology to facilitate their review." | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-reviewers.html | No date on page; © 2026 | 2026-10-30 |
| icmje_review_confidentiality_upload | Reviewer | Do not upload a manuscript to an AI tool that cannot guarantee confidentiality, unless the journal explicitly allows it. | Not applicable | "reviewers must maintain the confidentiality of the manuscript, which may prohibit the uploading of the manuscript to software or other AI technologies where confidentiality cannot be assured unless such use of AI is explicitly permitted by journals." | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-reviewers.html | No date on page; © 2026 | 2026-10-30 |
| icmje_review_disclose_ai | Reviewer | Tell the journal if you used AI in your review. | To the journal (review submission) | "Reviewers who use AI in their review should disclose its use to the journal and ensure the content is appropriate and valid" | https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-reviewers.html | No date on page; © 2026 | 2026-10-30 |

### COPE position statement: Authorship and AI tools

The "Last reviewed" field is blank. The page shows © 2024.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| cope_ai_not_author | Author | AI tools cannot be authors because they cannot take responsibility for the work. | Not applicable | "AI tools cannot meet the requirements for authorship as they cannot take responsibility for the submitted work." | https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools | Last reviewed blank; © 2024 | 2026-10-30 |
| cope_ai_disclosure_methods | Author | Disclose which AI tool you used and how, whether for writing, images, or data collection and analysis. | Materials and Methods (or similar section) | "Authors who use AI tools in the writing of a manuscript, production of images or graphical elements of the paper, or in the collection and analysis of data, must be transparent in disclosing in the Materials and Methods (or similar section) of the paper how the AI tool was used and which tool was used." | https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools | Last reviewed blank; © 2024 | 2026-10-30 |
| cope_author_full_responsibility | Author | Authors are fully responsible for AI-produced content and liable for any ethics breach. | Not applicable | "Authors are fully responsible for the content of their manuscript, even those parts produced by an AI tool, and are thus liable for any breach of publication ethics." | https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools | Last reviewed blank; © 2024 | 2026-10-30 |

### Springer Nature / Nature Portfolio AI policy (journal-level page)

Source note: the main Nature Portfolio page (nature.com/nature-portfolio/editorial-policies/ai) was not reachable this session. These rows come from the same policy on a Nature Portfolio journal's page (npj Quantum Information), which calls it a Springer Nature policy. The page shows no date. It did not include the "AI assisted copy editing" exemption that other copies of the policy are reported to contain, so that exemption is not encoded here.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| springernature_llm_not_author | Author | Do not list an LLM as an author. | Not applicable | "Large Language Models (LLMs), such as ChatGPT, do not currently satisfy our authorship criteria." | https://www.nature.com/npjqi/editorial-policies/ai | No date on page | 2026-10-30 |
| springernature_llm_use_methods | Author | Document LLM use in the Methods section, or in a suitable alternative if there is no Methods section. | Methods (or suitable alternative) | "Use of an LLM should be properly documented in the Methods section (and if a Methods section is not available, in a suitable alternative part)" | https://www.nature.com/npjqi/editorial-policies/ai | No date on page | 2026-10-30 |
| springernature_no_genai_images | Author | Generative AI images and video are not allowed in publications, apart from listed exceptions. | Not applicable | "Springer Nature journals are unable to permit its use for publication." | https://www.nature.com/npjqi/editorial-policies/ai | No date on page | 2026-10-30 |
| springernature_review_no_upload | Reviewer | Do not upload manuscripts into generative AI tools. | Not applicable | "peer reviewers do not upload manuscripts into generative AI tools." | https://www.nature.com/npjqi/editorial-policies/ai | No date on page | 2026-10-30 |
| springernature_review_declare_ai | Reviewer | If AI supported any part of your evaluation, say so in the review report. | Peer review report | "If any part of the evaluation of the claims made in the manuscript was in any way supported by an AI tool, we ask peer reviewers to declare the use of such tools transparently in the peer review report." | https://www.nature.com/npjqi/editorial-policies/ai | No date on page | 2026-10-30 |

### Elsevier: Generative AI policies for journals

"Policy updated June 2026."

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| elsevier_ai_human_oversight | Author | Use AI only with human oversight. It must not replace critical thinking. | Not applicable | "AI tools should always be applied with human oversight and control." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_author_accountable | Author | Authors stay responsible and accountable for all content, including AI output. | Not applicable | "Ultimately, authors are responsible and accountable for the contents of their work." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_ai_declaration_statement | Author | Include a separate AI declaration statement at submission. It will be published with the article. | Separate AI declaration statement in the manuscript | "in a separate AI declaration statement included in their manuscript upon submission." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_ai_declaration_template | Author | Use the suggested wording that names the tool and the reason. | AI declaration statement | "During the preparation of this work, the author(s) used [NAME OF TOOL / SERVICE] in order to [REASON]." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_grammar_check_exempt | Author | Basic grammar, spelling, and punctuation checks need no declaration. | None needed | "Basic checks of grammar, spelling and punctuation do not need a declaration statement." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_ai_not_author | Author | Do not list or cite AI tools as an author. | Not applicable | "Authors should not list AI tools as an author or co-author, nor cite AI tools as an author." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_no_ai_primary_data_images | Author | Do not use AI to create or alter images of primary observed or experimental data. | Not applicable | "AI tools must not be used to create or alter images that represent primary observed or experimental data that were not directly obtained in the research." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_review_no_upload | Reviewer | Do not upload a submitted manuscript, or any part of it, into an AI tool. | Not applicable | "Reviewers should not upload a submitted manuscript or any part of it into an AI tool." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_review_supportive_use_only | Reviewer | Use only private AI tools, and only for supportive tasks such as polishing the language of a report or searching background literature. | Not applicable | "AI tools may therefore only be used in a supportive capacity, for example to improve the language and structure of a review report, or to assist with a background literature search, provided that confidentiality is maintained and human control and oversight are exercised." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |
| elsevier_review_disclose_ai | Reviewer | Disclose AI use, the tool, and its purpose in the review report. | Review report | "Reviewers should disclose AI use in their review reports, including the tool used and purpose of the use." | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals | Policy updated June 2026 | 2026-10-30 |

### APA Journals: Policy on generative AI

Created November 2023. Last updated August 2025.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| apa_ai_not_author | Author | AI cannot be named as an author. | Not applicable | "AI cannot be named as an author on an APA scholarly publication." | https://www.apa.org/pubs/journals/resources/publishing-tips/policy-generative-ai | Last updated August 2025 | 2026-10-30 |
| apa_ai_disclose_methods_and_cite | Author | Disclose AI use in the Method section and cite the tool. | Method section (the page also says the most relevant place, most likely Introduction or Method) | "the use of AI must be disclosed in the methods section and cited." | https://www.apa.org/pubs/journals/resources/publishing-tips/policy-generative-ai | Last updated August 2025 | 2026-10-30 |
| apa_ai_verify_citations | Author | Verify every fact and citation an AI tool gives you. | Not applicable | "authors must verify any information and citations provided to them by an AI tool." | https://www.apa.org/pubs/journals/resources/publishing-tips/policy-generative-ai | Last updated August 2025 | 2026-10-30 |
| apa_review_no_genai_input | Reviewer, editor | Do not enter submitted manuscript material into generative AI. | Not applicable | "journal editors and reviewers may not enter materials from submitted manuscripts into generative AI" | https://www.apa.org/pubs/journals/resources/publishing-tips/policy-generative-ai | Last updated August 2025 | 2026-10-30 |

### Taylor & Francis: AI Policy (optional source)

The page gives no date or version. The footer shows © 2026 Informa plc.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| tandf_ai_not_author | Author | Do not list generative AI as an author. | Not applicable | "Generative AI tools must not be listed as an author" | https://taylorandfrancis.com/our-policies/ai-policy/ | No date; © 2026 | 2026-10-30 |
| tandf_ai_acknowledge_use | Author | Acknowledge any generative AI use in the article or book. Name the tool and version, and explain how and why you used it. | Within the article; articles need a specific AI usage disclosure statement | "Authors must clearly acknowledge within the article or book any use of Generative AI tools" | https://taylorandfrancis.com/our-policies/ai-policy/ | No date; © 2026 | 2026-10-30 |
| tandf_review_no_upload | Reviewer | Do not upload unpublished manuscripts or project proposals into generative AI tools. | Not applicable | "must not upload unpublished manuscripts or project proposals" | https://taylorandfrancis.com/our-policies/ai-policy/ | No date; © 2026 | 2026-10-30 |
| tandf_review_no_ai_reports | Reviewer | Do not use AI to generate review reports. AI may be used to improve the language of a review. | Not applicable | "must not use artificial intelligence tools to generate manuscript and proposal review reports" | https://taylorandfrancis.com/our-policies/ai-policy/ | No date; © 2026 | 2026-10-30 |

### IEEE: Author Guidelines for AI-Generated Text (optional source)

Dated April 16, 2024. This copy is on open.ieee.org. The page does not address reviewers.

| rule_id | applies_to | requirement | disclosure_location | exact_quote | source_url | page_date_or_version | accessed |
|---|---|---|---|---|---|---|---|
| ieee_ai_disclose_acknowledgments | Author | Disclose AI-generated content (text, figures, images, code) in the acknowledgments. Name the AI system, the sections affected, and the level of use. | Acknowledgments section | "shall be disclosed in the acknowledgments section of any article submitted to an IEEE publication." | https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/ | April 16, 2024 | 2026-10-30 |
| ieee_ai_identify_system_and_sections | Author | Identify the AI system and the specific sections that use AI content. | Acknowledgments section | "The AI system used shall be identified" ... "specific sections of the article that use AI-generated content shall be identified" | https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/ | April 16, 2024 | 2026-10-30 |
| ieee_ai_editing_disclosure_recommended | Author | AI used only for editing or grammar falls outside the policy, but disclosure is still recommended. | Acknowledgments (recommended) | "generally outside the intent of the above policy" | https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/ | April 16, 2024 | 2026-10-30 |

---

## Not verified

These items are not encoded because I could not open the primary page or confirm the text.

- **NIH FAQs on AI and application limits** (grants.nih.gov/faqs). The page is a JavaScript app and returned no FAQ text. Instead it returned an unrelated item about federal AI terminology that I could not confirm, so I left it out.
- **NIH 2026 updates on AI.** I found no 2026 NIH Guide notice that changes NOT-OD-25-132, NOT-OD-23-149, or NOT-OD-25-081. This is based on searches plus one university digest of 2026 NIH notices. It is not a full scan of the NIH Guide.
- **NSF PAPPG (current edition).** Not opened. The May 2026 NSF notice says the PAPPG will be updated to match, so check it for AI language.
- **Nature Portfolio main AI policy page** (nature.com/nature-portfolio/editorial-policies/ai). Not reachable this session. I used the matching journal-level page instead (see above). The "AI assisted copy editing" exemption is not verified.
- **ICMJE "AI use by editors" page and full Recommendations PDF version date.** Not opened. The opened pages show no version date.
- **Elsevier editors' rules.** I saw a summary, but I did not capture exact quotes, so no rows.
- **Science / AAAS editorial policies.** No primary page found or opened.
- **Wiley AI guidelines.** I found only third-party copies, not a Wiley page. Not opened.
- **Springer (link.springer.com) journal policies.** The page redirected with a cookie error and was not fetched.
- **NOT-OD-22-044** (NIH peer review confidentiality rules). Appeared in search but was not opened.
