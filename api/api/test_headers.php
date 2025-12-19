<?php
echo "Headers:\n";
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    foreach ($headers as $key => $value) {
        echo "$key: $value\n";
    }
} else {
    echo "getallheaders not available\n";
}

echo "\n_SERVER auth vars:\n";
foreach ($_SERVER as $key => $value) {
    if (strpos(strtolower($key), 'auth') !== false || strpos(strtolower($key), 'http') !== false) {
        echo "$key: $value\n";
    }
}
?>