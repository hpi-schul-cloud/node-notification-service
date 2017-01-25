<?php

// This script creates a valid push package.
// This script assumes that the website.json file and iconset already exist.
// This script creates a manifest and signature, zips the folder, and returns the push package.

// Convenience function that returns an array of raw files needed to construct the package.
function raw_files() {
    return array(
        'icon.iconset/icon_16x16.png',
        'icon.iconset/icon_16x16@2x.png',
        'icon.iconset/icon_32x32.png',
        'icon.iconset/icon_32x32@2x.png',
        'icon.iconset/icon_128x128.png',
        'icon.iconset/icon_128x128@2x.png',
        'website.json'
    );
}

// Creates the manifest by calculating the SHA1 hashes for all of the raw files in the package.
function create_manifest($package_dir) {
    // Obtain SHA1 hashes of all the files in the push package
    $manifest_data = array();
    foreach (raw_files() as $raw_file) {
        $manifest_data[$raw_file] = sha1(file_get_contents("$package_dir/$raw_file"));
    }
    file_put_contents("$package_dir/manifest.json", json_encode((object)$manifest_data));
}

// Creates a signature of the manifest using the push notification certificate.
function create_signature($package_dir, $cert_path, $cert_password) {
    global $intermediate_certificate_path;
    // Load the push notification certificate
    $pkcs12 = file_get_contents($cert_path);
    $certs = array();
    if(!openssl_pkcs12_read($pkcs12, $certs, $cert_password)) {
        return;
    }

    $signature_path = "$package_dir/signature";

    // Sign the manifest.json file with the private key from the certificate
    $cert_data = openssl_x509_read($certs['cert']);
    $private_key = openssl_pkey_get_private($certs['pkey'], $cert_password);
    file_get_contents("$package_dir/manifest.json");
    file_get_contents($intermediate_certificate_path);
    openssl_pkcs7_sign("$package_dir/manifest.json", $signature_path, $cert_data, $private_key, array(), PKCS7_BINARY | PKCS7_DETACHED, $intermediate_certificate_path);

    // Convert the signature from PEM to DER
    $signature_pem = file_get_contents($signature_path);
    $matches = array();
    if (!preg_match('~Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----~', $signature_pem, $matches)) {
        return;
    }
    $signature_der = base64_decode($matches[1]);
    file_put_contents($signature_path, $signature_der);
}

// Zips the directory structure into a push package, and returns the path to the archive.
function package_raw_data($package_dir) {
    $zip_path = "$package_dir.zip";

    // Package files as a zip file
    $zip = new ZipArchive();
    if (!$zip->open("$package_dir.zip", ZIPARCHIVE::CREATE)) {
        error_log('Could not create ' . $zip_path);
        return;
    }

    $raw_files = raw_files($icons_dir);
    $raw_files[] = 'manifest.json';
    $raw_files[] = 'signature';
    foreach ($raw_files as $raw_file) {
        $zip->addFile("$package_dir/$raw_file", $raw_file);
    }

    $zip->close();
    return $zip_path;
}

// Creates the push package, and returns the path to the archive.
function create_push_package($package_dir) {
    global $certificate_path, $certificate_password;

    create_manifest($package_dir);
    create_signature($package_dir, $certificate_path, $certificate_password);
    $package_path = package_raw_data($package_dir);

    return $package_path;
}


// MAIN
$temp_dir = $argv[1];
$secure_path = $argv[2];
$certificate_path = "$secure_path/cert.p12";     // Change this to the path where your certificate is located
$intermediate_certificate_path = "$secure_path/intermediate.pem";     // Change this to the path where the intermediate certificate is located
$certificate_password = "schul-cloud"; // Change this to the certificate's import password
$package_path = create_push_package($temp_dir);
if (empty($package_path)) {
    die;
}

echo $package_path;
die;
