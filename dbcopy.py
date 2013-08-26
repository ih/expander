import argparse
import subprocess
import re
import pdb

parser = argparse.ArgumentParser()
parser.add_argument(
    "command", help="copy the contents remote database to the local one")
args = parser.parse_args()

def get_remote_parameters():
    meteor_output = subprocess.check_output(
        'meteor mongo --url www.irvinote.com', shell=True)
    #TODO change to use regex
    print meteor_output
    password = re.search('client:(.*)@', meteor_output).group(1)
    host = re.search('@(.*)/', meteor_output).group(1)
    return (host, password)


if args.command == 'local2remote':

    # -h = host, -d = database name (must be meteor), -o = dump folder name
    subprocess.call('mongodump -h 127.0.0.1:3002 -d meteor', shell=True)
    #only good for 1 minute

    #TODO change so all args to mongorestore are parsed from meteor mongo --url
    parameters = get_remote_parameters()

    # -h = host, -d = database name (app domain), -p = password
    #folder = the path to the dumped db
    command = 'mongorestore -u client -h %s -d www_irvinote_com -p %s dump/meteor' % parameters
    print command
    subprocess.call(command, shell=True)
