echo "== Integration Tests =="

# Exit on error:
set -e;

function run_itest()
{
    ../../ispec/_run-and-check-exit-code.sh
    ../../ispec/_run-and-check-maximum-issues.sh
}

function run_itest_expect_zero_issues()
{
    ../../ispec/_run-and-check-exit-code-zero.sh
}

function install_and_run_itest()
{
    npm i > /dev/null && run_itest
}

pushd ../example/simple-zero-issues
run_itest_expect_zero_issues
popd

pushd ../example/simple
run_itest
popd

# TYPESCRIPT_VERSION is set for some travis builds (see .travis.yml)
if [ "$TYPESCRIPT_VERSION" = "4" ]
    pushd ../example/simple-new-ts-4-options
    run_itest
    popd
fi

pushd ../example/export-star-as-1
run_itest
popd

pushd ../example/export-star-as-2
run_itest
popd

pushd ../example/definition-files-absolute-paths
run_itest
popd

pushd ../example/definition-files-with-paths
run_itest
popd

pushd ../example/tsx
install_and_run_itest
popd

pushd ../example/with-paths
install_and_run_itest
popd

pushd ../example/absolute-paths-simple
install_and_run_itest
popd

pushd ../example/absolute-paths-2-tsconfigs
install_and_run_itest
popd

pushd ../example/path-alias-and-sub-folders
run_itest
popd
