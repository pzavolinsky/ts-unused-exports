# continue on error
set +e;

function run {
    node ../../bin/ts-unused-exports tsconfig.json --exitWithCount --ignorePaths=to-ignore $1
    ERROR_COUNT=$?
    if [ $ERROR_COUNT -ne 1 ]
    then
        echo "[FAIL] Expected 1 issue, but got {$ERROR_COUNT}."
    else
        echo "[PASS]."
    fi
}

run
run --showLineNumber
