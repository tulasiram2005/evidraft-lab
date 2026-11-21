import { chromium } from 'playwright';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.APP_URL || 'http://localhost:4173';
const browser = await chromium.launch({channel:'chrome'});
try {
  for (const width of [375, 768, 1024, 1440]) {
    for (const theme of ['light', 'dark']) {
      const dir = 'screenshots/' + width + '-' + theme;
      await mkdir(dir, {recursive:true});
      const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
      await page.addInitScript(t => localStorage.setItem('evidraft.theme',t),theme);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const shot = async name => {
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({path:dir+'/'+name+'.png',fullPage:true, animations:'disabled'});
      };
      const button = name => page.getByRole('button',{name}).first();
      const nav = async name => {
        const menu = button('Toggle navigation');
        if (await menu.isVisible()) await menu.click();
        await button(name).click();
      };
      const modal = async (label,name) => {
        await button(label).click();
        await page.getByRole('dialog').waitFor();
        await shot(name);
        await page.keyboard.press('Escape');
      };
      await page.goto(base+'/reference-v2.html');
      await shot('reference');
      await page.goto(base);
      await page.locator('.paper h1').waitFor();
      await shot('manuscript');
      await page.locator('.bound').first().click();
      await shot('binding');
      await button('Edit source').click();
      await shot('editor');
      await modal('Export','export');
      await modal('Accession edition','freeze');
      await modal(/About this build/,'guide');
      await nav(/^Specimens/);
      await shot('specimens');
      await modal('Import runs','import');
      await page.locator('.ledger-table tbody button').first().click();
      await shot('run');
      if (await page.locator('#compare option').count()>1) {
        await page.locator('#compare').selectOption({index:1});
        await shot('comparison');
      }
      await nav(/^Proofing/);
      await shot('proofing');
      await nav(/^Accessions/);
      await shot('accessions');
      await modal('Verify a bundle','verify');
      const images=(await readdir(dir)).filter(file=>file.endsWith('.png')&&file!=='reference.png');
      await writeFile(dir+'/review.html', '<!doctype html><meta charset="utf-8"><title>Evidraft visual review</title><style>body{font:16px system-ui;margin:2rem}section{display:grid;grid-template-columns:1fr 1fr;gap:1rem}img{width:100%;border:1px solid #bbb}</style><h1>'+width+'px · '+theme+'</h1>'+images.map(file=>'<h2>'+file+'</h2><section><div>Design reference<img src="reference.png"></div><div>Application<img src="'+file+'"></div></section>').join(''));
      assert.deepEqual(errors,[]);
      await page.close();
    }
  }
} finally { await browser.close(); }
