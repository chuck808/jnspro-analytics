<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { getUCICategory, calculateAge } from '$lib/utils/uciCategories';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Tyre = (typeof data.tyres)[number];

	// Group tyres by brand
	let tyresByBrand = $derived(() => {
		const grouped: Record<string, Tyre[]> = {};
		for (const tyre of data.tyres) {
			if (!grouped[tyre.brand]) grouped[tyre.brand] = [];
			grouped[tyre.brand].push(tyre);
		}
		return grouped;
	});

	// UCI category from DOB
	let uciCategory = $derived(() => getUCICategory(data.riderProfile?.date_of_birth));
	let riderAge = $derived(() => calculateAge(data.riderProfile?.date_of_birth));

	// Live gear ratio
	let chainring = $state(44);
	let sprocket = $state(16);

	// Sync with data.bike when it changes
	$effect(() => {
		chainring = data.bike?.chainring_teeth ?? 44;
		sprocket = data.bike?.sprocket_teeth ?? 16;
	});

	let gearRatio = $derived((chainring / sprocket).toFixed(2));

	// Profile completeness
	let completeness = $derived(() => {
		let score = 0;
		if (data.riderProfile?.weight_kg) score += 20;
		if (data.riderProfile?.height_cm) score += 15;
		if (data.riderProfile?.date_of_birth) score += 15;
		if (data.riderProfile?.rider_level) score += 10;
		if (data.bike?.crank_length_mm) score += 20;
		if (data.bike?.rear_tire_id || data.bike?.custom_wheel_diameter_inches) score += 20;
		return score;
	});

	let completenessLabel = $derived(() => {
		const c = completeness();
		if (c >= 80) return { text: 'Complete', color: 'text-[#3de8c8]', bar: 'bg-[#3de8c8]' };
		if (c >= 50) return { text: 'Partial', color: 'text-[#f5a623]', bar: 'bg-[#f5a623]' };
		return { text: 'Incomplete', color: 'text-[#ff4444]', bar: 'bg-[#ff4444]' };
	});

	// Form loading states
	let identitySaving = $state(false);
	let profileSaving = $state(false);
	let bikeSaving = $state(false);
	let prefsSaving = $state(false);

	// Image URLs (reactive binding)
	let profileIconUrl = $state<string | null>(null);
	let backgroundImageUrl = $state<string | null>(null);

	// Sync with data when it changes
	$effect(() => {
		profileIconUrl = data.profile?.profile_icon_url ?? null;
		backgroundImageUrl = data.profile?.background_image_url ?? null;
	});

	// Section helpers
	function successFor(key: string) {
		return (form as any)?.[key] === true;
	}
	function errorFor(key: string) {
		return (form as any)?.[key] as string | undefined;
	}

	// Countries list (abbreviated — common BMX nations first)
	const countries = [
		{ code: 'GBR', name: 'Great Britain' },
		{ code: 'USA', name: 'United States' },
		{ code: 'AUS', name: 'Australia' },
		{ code: 'NED', name: 'Netherlands' },
		{ code: 'FRA', name: 'France' },
		{ code: 'GER', name: 'Germany' },
		{ code: 'BEL', name: 'Belgium' },
		{ code: 'CAN', name: 'Canada' },
		{ code: 'NZL', name: 'New Zealand' },
		{ code: 'RSA', name: 'South Africa' },
		{ code: 'COL', name: 'Colombia' },
		{ code: 'ARG', name: 'Argentina' },
		{ code: 'JPN', name: 'Japan' },
		{ code: 'OTHER', name: 'Other' }
	];
</script>

<svelte:head>
	<title>Rider Profile — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<!-- User Images Section -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Profile Images</h3>
		<p class="mb-5 text-xs text-[#9a8f7a]">
			Customize your profile with a profile icon and background image
		</p>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Profile Icon -->
			<ImageUpload
				type="profile_icon"
				bind:currentUrl={profileIconUrl}
				title="Profile Icon"
				description="Displayed as a circle throughout the app"
				circular={true}
				maxSizeMB={5}
				on:uploaded={() => {
					// Refresh the page data after successful upload
					window.location.reload();
				}}
				on:error={(e: CustomEvent<{ message: string }>) => {
					console.error('Profile icon upload error:', e.detail.message);
				}}
			/>

			<!-- Background Image -->
			<ImageUpload
				type="background_image"
				bind:currentUrl={backgroundImageUrl}
				title="Background Image"
				description="Banner image for your profile header"
				aspectRatio="16/9"
				maxSizeMB={5}
				on:uploaded={() => {
					// Refresh the page data after successful upload
					window.location.reload();
				}}
				on:error={(e: CustomEvent<{ message: string }>) => {
					console.error('Background image upload error:', e.detail.message);
				}}
			/>
		</div>
	</div>

	<!-- Completeness banner -->
	<div class="themed-card rounded-xl p-5">
		<div class="mb-3 flex items-start justify-between gap-4">
			<div>
				<h2 class="themed-text-primary text-base font-semibold">Profile Completeness</h2>
				<p class="themed-text-secondary mt-0.5 text-xs">
					A complete profile unlocks power estimation and biomechanical analytics
				</p>
			</div>
			<div class="flex-shrink-0 text-right">
				<span class="text-2xl font-bold {completenessLabel().color}">{completeness()}%</span>
				<p class="text-xs {completenessLabel().color}">{completenessLabel().text}</p>
			</div>
		</div>
		<div class="h-2 w-full rounded-full bg-[#221c18]">
			<div
				class="h-2 rounded-full transition-all duration-500 {completenessLabel().bar}"
				style="width: {completeness()}%"
			></div>
		</div>
		{#if completeness() < 80}
			<div class="mt-3 flex flex-wrap gap-2 text-xs text-[#4a4038]">
				{#if !data.riderProfile?.weight_kg}
					<span class="rounded bg-[#221c18] px-2 py-1">+ Weight</span>
				{/if}
				{#if !data.riderProfile?.height_cm}
					<span class="rounded bg-[#221c18] px-2 py-1">+ Height</span>
				{/if}
				{#if !data.riderProfile?.date_of_birth}
					<span class="rounded bg-[#221c18] px-2 py-1">+ Date of birth</span>
				{/if}
				{#if !data.bike?.crank_length_mm}
					<span class="rounded bg-[#221c18] px-2 py-1">+ Crank length</span>
				{/if}
				{#if !data.bike?.rear_tire_id && !data.bike?.custom_wheel_diameter_inches}
					<span class="rounded bg-[#221c18] px-2 py-1">+ Rear tyre</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- UCI category display (if DOB set) -->
	{#if uciCategory()}
		{@const cat = uciCategory()!}
		<div class="flex items-center gap-4 rounded-xl border border-[#221c18] bg-[#131010] p-4">
			<div
				class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
				style="background: {cat.color}20; border: 1px solid {cat.color}40"
			>
				<span class="text-xs font-bold" style="color: {cat.color}">{cat.shortName}</span>
			</div>
			<div>
				<p class="text-sm font-semibold text-[#f0ece4]">{cat.name}</p>
				<p class="text-xs text-[#9a8f7a]">
					UCI category · Age {cat.ageRange}
					{#if riderAge()}· Current age: {riderAge()}{/if}
				</p>
			</div>
			<p class="ml-auto text-xs text-[#4a4038]">Calculated from date of birth</p>
		</div>
	{/if}

	<!-- Grid layout: two columns on large screens -->
	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- LEFT COLUMN -->
		<div class="space-y-6">
			<!-- Identity -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Identity</h3>
				<p class="mb-5 text-xs text-[#9a8f7a]">Your name and public display details</p>

				{#if successFor('identitySuccess')}
					<div
						class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
					>
						Identity saved
					</div>
				{/if}
				{#if errorFor('identityError')}
					<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
						{errorFor('identityError')}
					</div>
				{/if}

				<form
					method="POST"
					action="?/saveIdentity"
					onsubmit={() => (identitySaving = true)}
					class="space-y-4"
				>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="name" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Full name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								value={data.profile?.name ?? ''}
								class="input-field w-full"
								placeholder="Jamie Norris-Still"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="display_name" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Display name
								<span class="ml-1 font-normal text-[#4a4038]"
									>— shown on leaderboard (defaults to first name)</span
								>
							</label>
							<input
								id="display_name"
								name="display_name"
								type="text"
								value={data.profile?.display_name ?? ''}
								class="input-field w-full"
								placeholder="Jamie N-S"
							/>
						</div>

						<div>
							<label for="country" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Country
							</label>
							<select id="country" name="country" class="input-field w-full">
								<option value="">Select...</option>
								{#each countries as c}
									<option value={c.code} selected={data.profile?.country === c.code}>
										{c.name}
									</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="club" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Club
							</label>
							<input
								id="club"
								name="club"
								type="text"
								value={data.profile?.club ?? ''}
								class="input-field w-full"
								placeholder="e.g. Mid Lancs BMX"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="team" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Team <span class="font-normal text-[#4a4038]">(optional)</span>
							</label>
							<input
								id="team"
								name="team"
								type="text"
								value={data.profile?.team ?? ''}
								class="input-field w-full"
								placeholder="e.g. TeamGB Development"
							/>
						</div>
					</div>

					<button type="submit" disabled={identitySaving} class="btn-primary">
						{identitySaving ? 'Saving...' : 'Save identity'}
					</button>
				</form>
			</div>

			<!-- Biometrics -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Biometrics</h3>
				<p class="mb-5 text-xs text-[#9a8f7a]">
					Each save creates a versioned snapshot — historical sessions retain the biometrics that
					were active at the time
				</p>

				{#if successFor('profileSuccess')}
					<div
						class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
					>
						Biometrics saved
					</div>
				{/if}
				{#if errorFor('profileError')}
					<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
						{errorFor('profileError')}
					</div>
				{/if}

				<form
					method="POST"
					action="?/saveProfile"
					onsubmit={() => (profileSaving = true)}
					class="space-y-4"
				>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="date_of_birth" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Date of birth
								<span class="ml-1 font-normal text-[#4a4038]">— UCI category</span>
							</label>
							<input
								id="date_of_birth"
								name="date_of_birth"
								type="date"
								value={data.riderProfile?.date_of_birth ?? ''}
								class="input-field w-full"
							/>
						</div>

						<div>
							<label for="sex" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]"> Sex </label>
							<select id="sex" name="sex" class="input-field w-full">
								<option value="">Select...</option>
								<option value="male" selected={data.riderProfile?.sex === 'male'}>Male</option>
								<option value="female" selected={data.riderProfile?.sex === 'female'}>Female</option
								>
								<option
									value="prefer_not_to_say"
									selected={data.riderProfile?.sex === 'prefer_not_to_say'}
								>
									Prefer not to say
								</option>
							</select>
						</div>

						<div>
							<label for="height_cm" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Height <span class="text-[#4a4038]">(cm)</span>
							</label>
							<input
								id="height_cm"
								name="height_cm"
								type="number"
								min="50"
								max="250"
								step="0.1"
								value={data.riderProfile?.height_cm ?? ''}
								class="input-field w-full"
								placeholder="175"
							/>
						</div>

						<div>
							<label for="weight_kg" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Weight <span class="text-[#4a4038]">(kg)</span>
								<span class="ml-1 font-normal text-[#4a4038]">— power analytics</span>
							</label>
							<input
								id="weight_kg"
								name="weight_kg"
								type="number"
								min="20"
								max="200"
								step="0.1"
								value={data.riderProfile?.weight_kg ?? ''}
								class="input-field w-full"
								placeholder="72"
							/>
						</div>

						<div class="col-span-2">
							<label for="rider_level" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Rider level
								<span class="ml-1 font-normal text-[#4a4038]">— sets default analytics depth</span>
							</label>
							<select id="rider_level" name="rider_level" class="input-field w-full">
								<option value="" disabled selected={!data.riderProfile?.rider_level}
									>Select level...</option
								>
								{#each [{ value: 'novice', label: 'Novice — just getting started' }, { value: 'intermediate', label: 'Intermediate — club level' }, { value: 'expert', label: 'Expert — regional / national' }, { value: 'elite', label: 'Elite — national team / professional' }] as level}
									<option
										value={level.value}
										selected={data.riderProfile?.rider_level === level.value}
									>
										{level.label}
									</option>
								{/each}
							</select>
						</div>

						<!-- Years racing -->
						<div>
							<label for="years_racing" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Years racing BMX
							</label>
							<input
								id="years_racing"
								name="years_racing"
								type="number"
								min="0"
								max="50"
								step="1"
								value={data.riderProfile?.years_racing ?? ''}
								placeholder="e.g. 3"
								class="input-field w-full"
							/>
							<p class="mt-1 text-xs text-[#4a4038]">
								Independent of skill level — used for research stratification
							</p>
						</div>

						<!-- Dominant leg -->
						<div>
							<label for="dominant_leg" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Lead leg at the gate
								<span class="ml-1 font-normal text-[#4a4038]">— which leg is forward</span>
							</label>
							<select id="dominant_leg" name="dominant_leg" class="input-field w-full">
								<option value="" disabled selected={!data.riderProfile?.dominant_leg}
									>Select...</option
								>
								<option value="left" selected={data.riderProfile?.dominant_leg === 'left'}
									>Left leg forward</option
								>
								<option value="right" selected={data.riderProfile?.dominant_leg === 'right'}
									>Right leg forward</option
								>
								<option
									value="prefer_not_to_say"
									selected={data.riderProfile?.dominant_leg === 'prefer_not_to_say'}
									>Prefer not to say</option
								>
							</select>
						</div>
					</div>

					<button type="submit" disabled={profileSaving} class="btn-primary">
						{profileSaving ? 'Saving...' : 'Save biometrics'}
					</button>
				</form>
			</div>
		</div>

		<!-- RIGHT COLUMN -->
		<div class="space-y-6">
			<!-- Bike setup -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Bike Setup</h3>
				<p class="mb-5 text-xs text-[#9a8f7a]">
					Gear ratio and tyre diameter used for speed calculations. Crank length and bike weight
					used for power estimation.
				</p>

				{#if successFor('bikeSuccess')}
					<div
						class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
					>
						Bike setup saved
					</div>
				{/if}
				{#if errorFor('bikeError')}
					<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
						{errorFor('bikeError')}
					</div>
				{/if}

				<form
					method="POST"
					action="?/saveBike"
					onsubmit={() => (bikeSaving = true)}
					class="space-y-4"
				>
					{#if data.bike?.id}
						<input type="hidden" name="bike_id" value={data.bike.id} />
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div class="col-span-2">
							<label for="bike_name" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Bike name
							</label>
							<input
								id="bike_name"
								name="name"
								type="text"
								required
								value={data.bike?.name ?? ''}
								class="input-field w-full"
								placeholder="Race Bike 2024"
							/>
						</div>

						<div>
							<label for="bike_weight_kg" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Bike weight <span class="text-[#4a4038]">(kg)</span>
							</label>
							<input
								id="bike_weight_kg"
								name="weight_kg"
								type="number"
								min="1"
								max="30"
								step="0.1"
								value={data.bike?.weight_kg ?? ''}
								class="input-field w-full"
								placeholder="8.5"
							/>
						</div>

						<div>
							<label for="crank_length_mm" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Crank length <span class="text-[#4a4038]">(mm)</span>
							</label>
							<input
								id="crank_length_mm"
								name="crank_length_mm"
								type="number"
								min="100"
								max="200"
								value={data.bike?.crank_length_mm ?? ''}
								class="input-field w-full"
								placeholder="165"
							/>
						</div>

						<div>
							<label for="chainring_teeth" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Chainring <span class="text-[#4a4038]">(teeth)</span>
							</label>
							<input
								id="chainring_teeth"
								name="chainring_teeth"
								type="number"
								min="20"
								max="60"
								required
								bind:value={chainring}
								class="input-field w-full"
								placeholder="44"
							/>
						</div>

						<div>
							<label for="sprocket_teeth" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
								Sprocket <span class="text-[#4a4038]">(teeth)</span>
							</label>
							<input
								id="sprocket_teeth"
								name="sprocket_teeth"
								type="number"
								min="8"
								max="30"
								required
								bind:value={sprocket}
								class="input-field w-full"
								placeholder="16"
							/>
						</div>
					</div>

					<!-- Live gear ratio -->
					<div
						class="flex items-center gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-3"
					>
						<svg
							class="h-4 w-4 flex-shrink-0 text-[#f5a623]"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<span class="text-xs text-[#9a8f7a]">Gear ratio</span>
						<span class="text-sm font-bold text-[#f5a623]">{gearRatio} : 1</span>
						<span class="ml-auto text-xs text-[#4a4038]">{chainring}T / {sprocket}T</span>
					</div>

					<!-- Tyre selection -->
					<div class="space-y-3 border-t border-[#221c18] pt-3">
						<p class="text-xs font-medium text-[#9a8f7a]">
							Tyre selection
							<span class="ml-1 font-normal text-[#4a4038]"
								>— measured diameters for speed accuracy</span
							>
						</p>

						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label for="front_tire_id" class="mb-1 block text-xs text-[#4a4038]">Front</label>
								<select id="front_tire_id" name="front_tire_id" class="input-field w-full text-xs">
									<option value="">Select tyre...</option>
									{#each Object.entries(tyresByBrand()) as [brand, tyres]}
										<optgroup label={brand}>
											{#each tyres as tyre}
												<option value={tyre.id} selected={data.bike?.front_tire_id === tyre.id}>
													{tyre.model}
													{tyre.size} ({tyre.diameter_inches}")
												</option>
											{/each}
										</optgroup>
									{/each}
								</select>
							</div>

							<div>
								<label for="rear_tire_id" class="mb-1 block text-xs text-[#4a4038]">Rear</label>
								<select id="rear_tire_id" name="rear_tire_id" class="input-field w-full text-xs">
									<option value="">Select tyre...</option>
									{#each Object.entries(tyresByBrand()) as [brand, tyres]}
										<optgroup label={brand}>
											{#each tyres as tyre}
												<option value={tyre.id} selected={data.bike?.rear_tire_id === tyre.id}>
													{tyre.model}
													{tyre.size} ({tyre.diameter_inches}")
												</option>
											{/each}
										</optgroup>
									{/each}
								</select>
							</div>
						</div>

						<div>
							<label for="custom_wheel_diameter" class="mb-1 block text-xs text-[#4a4038]">
								Custom wheel diameter (inches) — if your tyre isn't listed
							</label>
							<input
								id="custom_wheel_diameter"
								name="custom_wheel_diameter"
								type="number"
								min="10"
								max="30"
								step="0.001"
								value={data.bike?.custom_wheel_diameter_inches ?? ''}
								class="input-field w-full sm:w-40"
								placeholder="e.g. 19.96"
							/>
						</div>
					</div>

					<div>
						<label for="notes" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							Notes <span class="font-normal text-[#4a4038]">(optional)</span>
						</label>
						<textarea
							id="notes"
							name="notes"
							rows="2"
							class="input-field w-full resize-none"
							placeholder="Tyre pressures, setup notes...">{data.bike?.notes ?? ''}</textarea
						>
					</div>

					<button type="submit" disabled={bikeSaving} class="btn-primary">
						{bikeSaving ? 'Saving...' : 'Save bike setup'}
					</button>
				</form>
			</div>

			<!-- Participation type -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Competition & Research</h3>
				<p class="mb-5 text-xs text-[#9a8f7a]">
					How you use BMX, and whether your anonymised data can contribute to research.
				</p>

				<form method="POST" action="?/saveResearch" class="space-y-5">
					<!-- Participation type -->
					<div>
						<label for="participation_type" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
							How do you participate in BMX?
						</label>
						<select id="participation_type" name="participation_type" class="input-field w-full">
							<option value="" disabled selected={!data.profile?.participation_type}
								>Select...</option
							>
							{#each [{ value: 'training_only', label: 'Training only — not racing competitively' }, { value: 'club_racing', label: 'Club racing — local club events' }, { value: 'regional', label: 'Regional — regional or county level' }, { value: 'national', label: 'National — national series or championships' }, { value: 'international', label: 'International — UCI World Cups / World Championships' }] as opt}
								<option value={opt.value} selected={data.profile?.participation_type === opt.value}>
									{opt.label}
								</option>
							{/each}
						</select>
						<p class="mt-1 text-xs text-[#4a4038]">
							Used to group performance thresholds by actual competition level
						</p>
					</div>

					<!-- Research consent -->
					<div class="space-y-3 rounded-lg border border-[#221c18] p-4">
						<div class="flex items-start gap-3">
							<input
								type="checkbox"
								id="research_consent"
								name="research_consent"
								value="true"
								checked={data.profile?.research_consent}
								class="mt-0.5 accent-[#f5a623]"
							/>
							<div>
								<label
									for="research_consent"
									class="cursor-pointer text-sm font-medium text-[#f0ece4]"
								>
									Contribute to BMX performance research
								</label>
								<p class="mt-1 text-xs leading-relaxed text-[#9a8f7a]">
									Allow your anonymised session data — including age category, sex, height, weight,
									bike setup, and performance metrics — to be made available to academic researchers
									studying BMX gate start mechanics and performance. Your name and contact details
									are <strong class="text-[#f0ece4]">never</strong> shared. You can withdraw consent at
									any time.
								</p>
								{#if data.profile?.research_consent_at}
									<p class="mt-1 text-xs text-[#4a4038]">
										Consent given: {new Date(data.profile.research_consent_at).toLocaleDateString(
											'en-GB',
											{ day: 'numeric', month: 'long', year: 'numeric' }
										)}
									</p>
								{/if}
							</div>
						</div>
					</div>

					<button type="submit" class="btn-primary">Save</button>
				</form>
			</div>

			<!-- Privacy & leaderboard preferences -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Privacy & Sharing</h3>
				<p class="mb-5 text-xs text-[#9a8f7a]">
					Control what's visible publicly including your profile images.
				</p>

				{#if successFor('prefsSuccess')}
					<div
						class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
					>
						Preferences saved
					</div>
				{/if}

				<form
					method="POST"
					action="?/savePrefs"
					onsubmit={() => (prefsSaving = true)}
					class="space-y-4"
				>
					<!-- Units -->
					<fieldset>
						<legend class="mb-2 block text-xs font-medium text-[#9a8f7a]">
							Measurement units
						</legend>
						<div class="flex gap-3">
							{#each [{ value: 'metric', label: 'Metric (km/h, kg, cm)' }, { value: 'imperial', label: 'Imperial (mph, lbs, ft)' }] as unit}
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="radio"
										name="measurement_unit"
										value={unit.value}
										checked={data.prefs?.measurement_unit === unit.value}
										class="accent-[#f5a623]"
									/>
									<span class="text-sm text-[#f0ece4]">{unit.label}</span>
								</label>
							{/each}
						</div>
					</fieldset>

					<!-- Leaderboard opt-in -->
					<div class="flex items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
						<input
							type="checkbox"
							id="show_on_leaderboard"
							name="show_on_leaderboard"
							value="true"
							checked={data.prefs?.show_on_leaderboard}
							class="mt-0.5 accent-[#f5a623]"
						/>
						<div>
							<label
								for="show_on_leaderboard"
								class="cursor-pointer text-sm font-medium text-[#f0ece4]"
							>
								Show on leaderboard
							</label>
							<p class="mt-0.5 text-xs text-[#4a4038]">
								Your display name and best performances visible to other riders. Leaderboard coming
								soon — opt in early to be ready.
							</p>
						</div>
					</div>

					<!-- Share stats -->
					<div class="flex items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
						<input
							type="checkbox"
							id="share_stats"
							name="share_stats"
							value="true"
							checked={data.prefs?.share_stats}
							class="mt-0.5 accent-[#f5a623]"
						/>
						<div>
							<label for="share_stats" class="cursor-pointer text-sm font-medium text-[#f0ece4]">
								Share anonymised stats
							</label>
							<p class="mt-0.5 text-xs text-[#4a4038]">
								Contribute anonymised performance data to help improve benchmark values for all
								riders.
							</p>
						</div>
					</div>

					<!-- Profile icon visibility -->
					<div class="flex items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
						<input
							type="checkbox"
							id="show_profile_icon"
							name="show_profile_icon"
							value="true"
							checked={data.prefs?.show_profile_icon ?? true}
							class="mt-0.5 accent-[#f5a623]"
						/>
						<div>
							<label
								for="show_profile_icon"
								class="cursor-pointer text-sm font-medium text-[#f0ece4]"
							>
								Show profile icon publicly
							</label>
							<p class="mt-0.5 text-xs text-[#4a4038]">
								Allow other users to see your profile icon on leaderboards and in shared contexts.
							</p>
						</div>
					</div>

					<!-- Background image visibility -->
					<div class="flex items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
						<input
							type="checkbox"
							id="show_background_image"
							name="show_background_image"
							value="true"
							checked={data.prefs?.show_background_image ?? true}
							class="mt-0.5 accent-[#f5a623]"
						/>
						<div>
							<label
								for="show_background_image"
								class="cursor-pointer text-sm font-medium text-[#f0ece4]"
							>
								Show background image publicly
							</label>
							<p class="mt-0.5 text-xs text-[#4a4038]">
								Allow other users to see your background image when viewing your public profile.
							</p>
						</div>
					</div>

					<button type="submit" disabled={prefsSaving} class="btn-primary">
						{prefsSaving ? 'Saving...' : 'Save preferences'}
					</button>
				</form>
			</div>
		</div>
	</div>

	<!-- Summary strip -->
	{#if data.riderProfile || data.bike}
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<p class="mb-4 text-xs font-semibold tracking-wider text-[#4a4038] uppercase">
				Current Setup Summary
			</p>
			<div class="grid grid-cols-3 gap-4 text-center sm:grid-cols-6">
				{#each [{ label: 'Height', value: data.riderProfile?.height_cm ? `${data.riderProfile.height_cm} cm` : '—' }, { label: 'Weight', value: data.riderProfile?.weight_kg ? `${data.riderProfile.weight_kg} kg` : '—' }, { label: 'UCI Cat.', value: uciCategory()?.shortName ?? '—' }, { label: 'Crank', value: data.bike?.crank_length_mm ? `${data.bike.crank_length_mm}mm` : '—' }, { label: 'Gear Ratio', value: data.bike ? `${(data.bike.chainring_teeth / data.bike.sprocket_teeth).toFixed(2)}:1` : '—' }, { label: 'Rear Tyre', value: (data.bike as any)?.rear_tire?.size ?? (data.bike?.custom_wheel_diameter_inches ? `${data.bike.custom_wheel_diameter_inches}"` : '—') }] as stat}
					<div>
						<p class="mb-1 text-xs text-[#4a4038]">{stat.label}</p>
						<p class="text-base font-bold text-[#f5a623]">{stat.value}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.input-field) {
		padding: 0.625rem 1rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 0.5rem;
		color: #f0ece4;
		font-size: 0.875rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	:global(.input-field:focus) {
		outline: none;
		border-color: #f5a623;
		box-shadow: 0 0 0 1px #f5a623;
	}

	:global(.input-field::placeholder) {
		color: #4a4038;
	}

	:global(.btn-primary) {
		padding: 0.625rem 1.25rem;
		background: #f5a623;
		color: #0a0809;
		font-weight: 600;
		font-size: 0.875rem;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	:global(.btn-primary:hover) {
		background: #c97e0a;
	}

	:global(.btn-primary:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
