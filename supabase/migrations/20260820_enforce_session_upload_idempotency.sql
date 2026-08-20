-- Prevent the same physical upload payload being recorded twice for one user.
-- NULL checksums remain allowed for legacy/non-file sessions.
--
-- Deliberately fail the migration if historical duplicate non-null checksums
-- already exist. Silently deleting or choosing between historical sessions
-- would destroy evidence and must be handled explicitly if encountered.

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM public.sessions
		WHERE file_checksum IS NOT NULL
		GROUP BY user_id, file_checksum
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION
			'Cannot enforce session upload idempotency: duplicate (user_id, file_checksum) rows already exist';
	END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_user_file_checksum_unique
	ON public.sessions (user_id, file_checksum)
	WHERE file_checksum IS NOT NULL;
