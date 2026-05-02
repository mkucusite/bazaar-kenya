<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>KenyaAdvert Sitemap</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
          header { background: #16a34a; color: white; padding: 20px 40px; display: flex; align-items: center; gap: 16px; }
          header h1 { font-size: 22px; font-weight: 700; }
          header p { font-size: 13px; opacity: 0.85; margin-top: 2px; }
          .badge { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
          .container { max-width: 960px; margin: 32px auto; padding: 0 20px; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          td { padding: 12px 16px; border-top: 1px solid #f1f5f9; font-size: 14px; }
          tr:hover td { background: #f8fafc; }
          a { color: #16a34a; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .meta { color: #94a3b8; font-size: 12px; }
          .count { background: #dcfce7; color: #15803d; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>🗺 KenyaAdvert Sitemap</h1>
            <p>XML Sitemap — Kenya's Trusted Classifieds Platform</p>
          </div>
        </header>
        <div class="container">

          <!-- Sitemap Index -->
          <xsl:if test="sitemap:sitemapindex">
            <p style="margin-bottom:16px; color:#64748b; font-size:14px;">
              <span class="count"><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/> sitemaps</span>
            </p>
            <table>
              <tr>
                <th>Sitemap URL</th>
                <th>Last Modified</th>
              </tr>
              <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                <tr>
                  <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                  <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </table>
          </xsl:if>

          <!-- URL Set -->
          <xsl:if test="sitemap:urlset">
            <p style="margin-bottom:16px; color:#64748b; font-size:14px;">
              <span class="count"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</span>
            </p>
            <table>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Freq</th>
                <th>Priority</th>
              </tr>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                  <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:priority"/></td>
                </tr>
              </xsl:for-each>
            </table>
          </xsl:if>

        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
