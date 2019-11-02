# continue on error
set +e;

function run {
    node ../../bin/ts-unused-exports tsconfig.json --exitWithCount --ignorePaths=to-ignore $1
    ERROR_COUNT=$?
    if [ $ERROR_COUNT -ne 2 ]
    then
        echo "[FAIL] Expected 2 issues, but got {$ERROR_COUNT}."
    else
        echo "[PASS]."
    fi
}

run
run --showLineNumber
