"""Build site/baton.zip and copy installers into site/. Run: python build.py [https-host-without-scheme]"""
import sys, shutil, zipfile, pathlib
root = pathlib.Path(__file__).parent
site = root / 'site'
host = sys.argv[1] if len(sys.argv) > 1 else None
for n in ('install.ps1', 'install.sh'):
    t = (root / n).read_text(encoding='utf8')
    if host: t = t.replace('BATON_SITE', host)
    (site / n).write_text(t, encoding='utf8', newline='\n')
with zipfile.ZipFile(site / 'baton.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for base in ('skill', 'overlay'):
        for p in sorted((root / base).rglob('*')):
            if p.is_file(): z.write(p, p.relative_to(root).as_posix())
    for n in ('install.ps1', 'install.sh'): z.write(root / n, n)
print('built', (site / 'baton.zip').stat().st_size, 'bytes', '(host=%s)' % host)
