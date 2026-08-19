<footer class="footer">
	<div class="footer-inner">
		<div class="footer-brand">
			<a href="/" class="fb-link">
				<img src="/logo-icon-dark.svg" alt="JNS" class="fb-icon" />
				<div>
					<p class="fb-name">AppGatePro</p>
					<p class="fb-by">by JNS Pro Systems</p>
				</div>
			</a>
			<p class="fb-desc">Honest BMX gate start analytics — built at the track, not in a lab.</p>
		</div>
		<div class="footer-nav">
			<div class="fn-col">
				<h4 class="fn-title">Product</h4>
				<a href="/" class="fn-link">Home</a>
				<a href="/about" class="fn-link">About</a>
				<a href="/docs" class="fn-link">Docs</a>
			</div>
			<div class="fn-col">
				<h4 class="fn-title">Account</h4>
				<a href="/auth/sign-in" class="fn-link">Sign in</a>
				<a href="/auth/sign-up" class="fn-link">Join beta</a>
			</div>
			<div class="fn-col">
				<h4 class="fn-title">Legal</h4>
				<a href="/privacy" class="fn-link">Privacy</a>
				<a href="/terms" class="fn-link">Terms</a>
				<a href="/contact" class="fn-link">Contact</a>
			</div>
		</div>
	</div>
	<div class="footer-bottom">
		<p class="footer-copy">© {new Date().getFullYear()} JNS Pro Systems</p>
		<span class="footer-beta">Beta</span>
	</div>
</footer>

<style>
	.footer {
		background: #080707;
		border-top: 1px solid #131010;
		padding: 3rem 0 2rem;
	}
	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 4rem;
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 4rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #131010;
	}
	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.fb-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		width: fit-content;
	}
	.fb-icon {
		width: 28px;
		height: 28px;
		opacity: 0.7;
	}
	.fb-name {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: 0.9rem;
		color: #f5a623;
		margin: 0;
	}
	.fb-by {
		font-size: 0.65rem;
		color: #4a4038;
		margin: 0;
	}
	.fb-desc {
		font-size: 0.8rem;
		color: #4a4038;
		line-height: 1.6;
		max-width: 360px;
		margin: 0;
	}
	.footer-nav {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}
	.fn-col {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.fn-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.72rem;
		color: #6a5f4f;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 0.25rem;
	}
	.fn-link {
		font-size: 0.825rem;
		color: #4a4038;
		text-decoration: none;
		transition: color 0.2s;
		width: fit-content;
	}
	.fn-link:hover {
		color: #f5a623;
	}
	.footer-bottom {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 4rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.footer-copy {
		font-size: 0.72rem;
		color: #2a2018;
		margin: 0;
	}
	.footer-beta {
		font-size: 0.65rem;
		font-weight: 700;
		color: #f5a623;
		background: rgba(245, 166, 35, 0.05);
		border: 1px solid rgba(245, 166, 35, 0.12);
		padding: 0.25rem 0.65rem;
		border-radius: 100px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	@media (max-width: 768px) {
		.footer-inner {
			grid-template-columns: 1fr;
			gap: 2rem;
			padding: 0 1.25rem;
			margin-bottom: 1.5rem;
			padding-bottom: 1.5rem;
		}
		.footer-nav {
			grid-template-columns: repeat(3, 1fr);
		}
		.footer-bottom {
			padding: 0 1.25rem;
		}
	}
	@media (max-width: 480px) {
		.footer-nav {
			grid-template-columns: 1fr;
		}
	}
</style>
