"""Exercise false-green failure modes without running game code."""
from copy import deepcopy
import unittest
from gate import EXPECTED_CASES, validate_report
from run import contains_ordered_states


def complete_report():
    return dict(source_unchanged=True, infrastructure_errors=[], profiles=[
        dict(profile=p, tests=[dict(name=t, status='PASS') for t in tests])
        for p, tests in EXPECTED_CASES.items()])


class GateTests(unittest.TestCase):
    def test_complete_run_passes(self):
        self.assertEqual(validate_report(complete_report()), [])

    def test_zero_missing_duplicate_and_unexpected_checks_fail(self):
        for kind in ('zero', 'missing', 'duplicate', 'unexpected', 'missing-profile'):
            with self.subTest(kind=kind):
                r=complete_report(); tests=r['profiles'][0]['tests']
                if kind=='zero':r['profiles']=[]
                elif kind=='missing':tests.pop()
                elif kind=='duplicate':tests.append(deepcopy(tests[0]))
                elif kind=='unexpected':tests[0]['name']='unrecognized-check'
                else:r['profiles'].pop()
                self.assertTrue(validate_report(r))

    def test_failed_skipped_unrun_and_unknown_statuses_fail(self):
        for status in ('FAIL', 'SKIP', 'UNRUN', 'EXPECTED_FAIL', None):
            with self.subTest(status=status):
                r=complete_report();r['profiles'][0]['tests'][0]['status']=status
                self.assertTrue(validate_report(r))

    def test_duplicate_profile_cannot_replace_missing_profile(self):
        r=complete_report();r['profiles'][1]=deepcopy(r['profiles'][0])
        self.assertTrue(validate_report(r))

    def test_infrastructure_failure_and_unverified_source_fail(self):
        r=complete_report();r['infrastructure_errors']=['Chromium failed to launch']
        self.assertTrue(validate_report(r))
        r=complete_report();r['source_unchanged']=False
        self.assertTrue(validate_report(r))

    def test_initial_idle_cannot_substitute_for_recovery(self):
        expected=['carry','air','down','getup','idle']
        self.assertFalse(contains_ordered_states(['idle','carry','air','down','getup'],expected))
        self.assertFalse(contains_ordered_states(['idle','carry','air','getup','down','idle'],expected))
        self.assertTrue(contains_ordered_states(['idle','carry','air','down','getup','idle'],expected))


if __name__=='__main__':
    unittest.main()
