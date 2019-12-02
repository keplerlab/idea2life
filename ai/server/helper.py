"""
.. module:: server.helper
    :platform: OS X and Linux
    :synopsis: This module has commonly used helper functions used by server module
"""


import os
import sys
import glob
import platform

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def redirect_stderr():

    sys.stderr.flush()  # <--- important when redirecting to files

    # Duplicate stdout (file descriptor 1)
    # to a different file descriptor number
    newstderr = os.dup(2)

    # /dev/null is used just to discard what is being printed
    devnull = os.open("/dev/null", os.O_WRONLY)

    # Duplicate the file descriptor for /dev/null
    # and overwrite the value for stdout (file descriptor 1)
    os.dup2(devnull, 2)

    # Close devnull after duplication (no longer needed)
    os.close(devnull)

    # Use the original stdout to still be able
    # to print to stdout within python
    sys.stderr = os.fdopen(newstderr, "w")


def redirect_stdout():

    sys.stdout.flush()  # <--- important when redirecting to files

    # Duplicate stdout (file descriptor 1)
    # to a different file descriptor number
    newstdout = os.dup(1)

    # /dev/null is used just to discard what is being printed
    devnull = os.open("/dev/null", os.O_WRONLY)

    # Duplicate the file descriptor for /dev/null
    # and overwrite the value for stdout (file descriptor 1)
    os.dup2(devnull, 1)

    # Close devnull after duplication (no longer needed)
    os.close(devnull)

    # Use the original stdout to still be able
    # to print to stdout within python
    sys.stdout = os.fdopen(newstdout, "w")


def _creation_date(path_to_file):
    """
    Internal function for getting creation date
    Try to get the date that a file was created, falling back to when it was
    last modified if that isn't possible.
    See http://stackoverflow.com/a/39501288/1709587 for explanation.

    :param path_to_file: Get unique file name by getting creation date
    :type path_to_file: string
    :return: get creation date
    :rtype: stat.st_mtime

    """
    if platform.system() == "Windows":
        return os.path.getctime(path_to_file)
    else:
        stat = os.stat(path_to_file)
        try:
            return stat.st_birthtime
        except AttributeError:
            # We're probably on Linux. No easy way to get creation dates here,
            # so we'll settle for when its content was last modified.
            return stat.st_mtime


def return_top_10_files(image_folder):
    files_list = glob.glob(os.path.join(image_folder, "*"))
    files = sorted(files_list, key=_creation_date, reverse=True)
    files = [os.path.split(_file)[1] for _file in files]
    files = [_ for _ in files if "out" in _]
    top_10_files = files[:10]
    return top_10_files
