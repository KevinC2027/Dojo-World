"""Require every declared browser check, including on partial/failed runs."""
COMMON = ('startup-and-render', 'movement-and-sidestep', 'guard-hold-release',
          'attack-P', 'attack-K', 'attack-L', 'attack-T',
          'ko-next-round-match-rematch', 'browser-errors')
EXPECTED_CASES = {
    'desktop': COMMON + ('natural-opponent-ai', 'out-of-range-whiff',
                         'guard-chip-and-blockstun', 'buffered-punch-kick-chain',
                         'timeout-win', 'timeout-draw', 'ring-out'),
    'mobile-chromium-emulation': COMMON,
}


def validate_report(report):
    errors = []
    if report.get('infrastructure_errors'):
        errors.append('Infrastructure errors occurred')
    if report.get('source_unchanged') is not True:
        errors.append('Source preservation not verified')
    seen_profiles = set()
    seen_cases = set()
    counts = dict(PASS=0, FAIL=0, SKIP=0, UNRUN=0)
    for profile in report.get('profiles', []):
        name = profile.get('profile')
        if name in seen_profiles or name not in EXPECTED_CASES:
            errors.append(f'Duplicate or unexpected profile: {name}')
        seen_profiles.add(name)
        for test in profile.get('tests', []):
            key = (name, test.get('name'))
            if key in seen_cases:
                errors.append(f'Duplicate check: {key}')
            seen_cases.add(key)
            status = test.get('status')
            if status in counts:
                counts[status] += 1
            if status != 'PASS':
                errors.append(f'Nonpassing check: {key} ({status})')
    expected = {(p, t) for p, tests in EXPECTED_CASES.items() for t in tests}
    if seen_cases != expected:
        errors.append(f'Check set mismatch: missing={sorted(expected-seen_cases)}, '
                      f'unexpected={sorted(seen_cases-expected)}')
    if seen_profiles != set(EXPECTED_CASES):
        errors.append('Profile set mismatch')
    if counts != dict(PASS=25, FAIL=0, SKIP=0, UNRUN=0):
        errors.append(f'Expected 25 passes; actual status counts: {counts}')
    return errors
