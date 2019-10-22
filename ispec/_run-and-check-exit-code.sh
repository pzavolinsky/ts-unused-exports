# continue on error
set +e;
node ../../bin/ts-unused-exports tsconfig.json --exitWithCount
ERROR_COUNT=$?
if [ $ERROR_COUNT -ne 1 ]
then 
    echo "[FAIL] Expected 1 issue, but got {$ERROR_COUNT}."
else
    echo "[PASS]."
    exit 0
fi
