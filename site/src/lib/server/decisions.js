import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isGitRepo, showFile } from './git.js';

/** @typedef {{file:string,commit:string,sha256:string}} DecisionDocument */
/** @typedef {{members:number,present:number,met:boolean}} Quorum */
/** @typedef {{for:number,against:number,abstain:number,invalid:number}} Votes */
/** @typedef {{id:string,date:string,body:string,clause:string,quorum:Quorum,votes:Votes,rule:string,result:'可決'|'否決',effectiveDate:string,pullRequest:number,documents:DecisionDocument[],minutesVerified:boolean,summary:string}} Decision */

/** @param {unknown} value */
const isDate = (value) =>
	typeof value === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	Number.isFinite(Date.parse(value)) &&
	new Date(value).toISOString().slice(0, 10) === value;

/** @param {unknown} value */
const isCount = (value) => Number.isInteger(value) && /** @type {number} */ (value) >= 0;

/** @param {unknown} value */
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Reads the public decision summaries in decisions/*.json and checks that each
 * one is internally consistent and that every voted text matches the commit it
 * names. Files starting with "_" are templates and are skipped.
 * @param {string} decisionsRoot
 * @param {string} repo repository root, for checking voted commits
 * @returns {Map<string, Decision>}
 */
export function loadDecisions(decisionsRoot, repo) {
	/** @type {Map<string, Decision>} */
	const decisions = new Map();
	if (!existsSync(decisionsRoot)) return decisions;
	const checkCommits = isGitRepo(repo);
	for (const name of readdirSync(decisionsRoot).sort()) {
		if (!name.endsWith('.json') || name.startsWith('_')) continue;
		/** @type {Decision} */
		const decision = JSON.parse(readFileSync(resolve(decisionsRoot, name), 'utf8'));
		/** @type {(message: string) => never} */
		const fail = (message) => {
			throw new Error(`決議記録 ${name}: ${message}`);
		};
		if (decision.id !== name.slice(0, -'.json'.length)) fail('idとファイル名が一致しません');
		if (!/^[0-9a-z-]+$/.test(decision.id)) fail('idは英小文字・数字・ハイフンで付けてください');
		if (!isDate(decision.date)) fail('決議日が不正です');
		if (!isDate(decision.effectiveDate)) fail('施行日が不正です');
		if (decision.date > new Date().toISOString().slice(0, 10)) fail('決議日が未来の日付です');
		if (decision.effectiveDate < decision.date) fail('施行日が決議日より前です');
		for (const field of /** @type {const} */ (['body', 'clause', 'rule', 'summary']))
			if (!isText(decision[field])) fail(`${field} がありません`);
		if (decision.result !== '可決' && decision.result !== '否決')
			fail('resultは「可決」か「否決」です');
		if (!Number.isInteger(decision.pullRequest) || decision.pullRequest < 1)
			fail('対象PRの番号が不正です');
		if (typeof decision.minutesVerified !== 'boolean')
			fail('minutesVerifiedを true か false で記録してください');
		const { quorum, votes } = decision;
		if (!quorum || !isCount(quorum.members) || !isCount(quorum.present))
			fail('定足数の記録が不正です');
		if (typeof quorum.met !== 'boolean') fail('定足数の成立を true か false で記録してください');
		if (quorum.present > quorum.members) fail('出席者数が部員数を超えています');
		if (
			!votes ||
			!(
				/** @type {(keyof Votes)[]} */ (['for', 'against', 'abstain', 'invalid']).every((key) =>
					isCount(votes[key])
				)
			)
		)
			fail('票数の記録が不正です');
		if (votes.for + votes.against + votes.abstain + votes.invalid > quorum.present)
			fail('票数の合計が出席者数を超えています');
		if (decision.result === '可決' && !quorum.met) fail('定足数が不成立なのに可決としています');
		if (!Array.isArray(decision.documents) || decision.documents.length === 0)
			fail('対象文書がありません');
		for (const document of decision.documents) {
			if (typeof document.file !== 'string' || !/^[a-z0-9/-]+\.md$/.test(document.file))
				fail('対象文書のパスが不正です');
			if (!/^[0-9a-f]{40}$/.test(document.commit))
				fail(`${document.file}: 投票対象コミットは40桁のSHAで記録してください`);
			if (!/^[0-9a-f]{64}$/.test(document.sha256)) fail(`${document.file}: 本文SHA-256が不正です`);
			if (!checkCommits) continue;
			const bytes = showFile(repo, document.commit, `rules/${document.file}`);
			if (!bytes) fail(`${document.file}: 投票対象コミットに本文がありません`);
			if (createHash('sha256').update(bytes).digest('hex') !== document.sha256)
				fail(`${document.file}: 投票対象コミットの本文とSHA-256が一致しません`);
		}
		decisions.set(decision.id, decision);
	}
	return decisions;
}

/**
 * Why a document cannot be shown as adopted under this decision, or undefined
 * when the decision backs the current text.
 * @param {Decision | undefined} decision
 * @param {string} file
 * @param {string} sha256 hash of the current text
 */
export function adoptionProblem(decision, file, sha256) {
	if (!decision) return '決議記録がありません';
	if (decision.result !== '可決') return '決議が可決されていません';
	if (!decision.minutesVerified) return '原議事録との照合が済んでいません';
	const document = decision.documents.find((entry) => entry.file === file);
	if (!document) return 'この文書は決議の対象に含まれていません';
	if (document.sha256 !== sha256) return '決議後に本文が変わっています。再審議が必要です';
	return undefined;
}
