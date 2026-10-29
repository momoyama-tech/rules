import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';

export const defaultRepo = resolve(process.cwd(), '..');

/**
 * @param {string} repo
 * @param {string[]} args
 */
export function git(repo, args) {
	return execFileSync('git', ['-C', repo, ...args], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'ignore']
	});
}

/**
 * Bytes of a file at a commit, or undefined when the commit or file is not in
 * this checkout's history.
 * @param {string} repo
 * @param {string} commit
 * @param {string} path repository-relative path
 */
export function showFile(repo, commit, path) {
	try {
		return execFileSync('git', ['-C', repo, 'show', `${commit}:${path}`], {
			maxBuffer: 64 * 1024 * 1024,
			stdio: ['ignore', 'pipe', 'ignore']
		});
	} catch {
		return undefined;
	}
}

/** @param {string} repo */
export function isGitRepo(repo) {
	try {
		return (
			realpathSync(git(repo, ['rev-parse', '--show-toplevel']).trim()) ===
			realpathSync(resolve(repo))
		);
	} catch {
		return false;
	}
}
