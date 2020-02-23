# continue on error
set +e;

function runSuccessCase {
    node ../../bin/ts-unused-exports tsconfig.json --maxIssues=2 --excludePathsFromReport=to-ignore $1
    ERROR_CODE=$?
    if [ $ERROR_CODE -ne 0 ]
    then
        echo "[FAIL] Expected error code 0 for 2 issues, but got ${ERROR_CODE}."
        exit 1
    else
        echo "[PASS]."
    fi
}

function runFailureCase {
    node ../../bin/ts-unused-exports tsconfig.json --maxIssues=1 --excludePathsFromReport=to-ignore $1
    ERROR_CODE=$?
    if [ $ERROR_CODE -ne 1 ]
    then
        echo "[FAIL] Expected error code 1 for 2 issues, but got ${ERROR_CODE}."
        exit 1
    else
        echo "[PASS]."
    fi
}

runSuccessCase
runSuccessCase --showLineNumber

runFailureCase
runFailureCase --showLineNumber
