# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# http://www.sphinx-doc.org/en/master/config

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import os
import sys
import sphinx_rtd_theme


# -- Set start point ---------------------
master_doc = 'index'

sys.path.insert(0, os.path.abspath(os.path.join('..','..','ai')))


root_for_relative_js_paths = os.path.abspath((os.path.join('..','..','idea2life')))

print("root_for_relative_js_paths", root_for_relative_js_paths)

js_source_path = [
    os.path.join(root_for_relative_js_paths, '.'),
    os.path.join(root_for_relative_js_paths, 'admin'),
    os.path.join(root_for_relative_js_paths, 'public'),
    os.path.join(root_for_relative_js_paths, 'ui'),
    os.path.join(root_for_relative_js_paths, 'generator'),
    os.path.join(root_for_relative_js_paths, 'layout')
]

# -- Project information -----------------------------------------------------

project = 'idea2Life'
copyright = '2019, Kepler'
author = 'Kepler'


# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ['sphinx.ext.viewcode', 'sphinx.ext.autodoc','sphinx_js', 'sphinx_rtd_theme', 'sphinx.ext.autosectionlabel']
exclude_patterns = [
    'build/*'
]

autoclass_content = 'both'

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = []


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#



html_theme = "sphinx_rtd_theme"

#html_theme = 'alabaster'

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']
