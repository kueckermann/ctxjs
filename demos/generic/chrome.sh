#!/bin/bash
#Starts up index.html
reg="/c/";
rep="/C:/"
project_path="file://${PWD//$reg/$rep}/$1";

chrome --new-window "$project_path" --allow-file-access-from-files
