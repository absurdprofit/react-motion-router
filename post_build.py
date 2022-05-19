import shutil

shutil.copy('./package.json', './build')
shutil.copy('./README.md', './build')

shutil.move('./build/utils.js', './build/common')
# shutil.move('./build/utils.js.map', './build/common')