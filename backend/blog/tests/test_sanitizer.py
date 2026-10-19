import html
import pytest
from .. import sanitizer


class TestSanitizeHtml:
    def test_script_and_content_dropped(self):
        out = sanitizer.sanitize_html("<p>سلام</p><script>alert('x')</script>")
        assert out == "<p>سلام</p>"

    def test_event_handlers_removed(self):
        out = sanitizer.sanitize_html('<p onclick="evil()">hi</p>')
        assert out == "<p>hi</p>"

    def test_img_javascript_src_dropped(self):
        out = sanitizer.sanitize_html("<img src=\"javascript:alert('x')\">")
        assert out == ""

    def test_img_https_relative_kept(self):
        out = sanitizer.sanitize_html(
            '<img src="/media_libm/a.webp" alt="عکس" width="800">'
        )
        assert '<img src="/media_libm/a.webp" alt="عکس" width="800">' in out
        out2 = sanitizer.sanitize_html("<img src=\"//cdn.example.com/a.webp\">")
        assert out2.startswith('<img src="https://cdn.example.com/a.webp"')

    def test_iframe_host_allowlist(self):
        bad = sanitizer.sanitize_html('<iframe src="https://evil.com/x">')
        assert bad == ""
        aparat = sanitizer.sanitize_html(
            '<iframe src="https://www.aparat.com/video/video/embed/videoid/xyz" width="640"></iframe>'
        )
        assert 'src="https://www.aparat.com/video/video/embed/videoid/xyz"' in aparat
        assert aparat.startswith('<iframe frameborder="0" allowfullscreen src="https://www.aparat.com')
        youtube = sanitizer.sanitize_html('<iframe src="https://youtube.com/embed/a"></iframe>')
        assert "youtube.com/embed/a" in youtube
        nested = sanitizer.sanitize_html('<iframe src="https://www.youtube.com/embed/a"></iframe>')
        assert "www.youtube.com/embed/a" in nested

    def test_iframe_without_safe_src_dropped(self):
        out = sanitizer.sanitize_html('<iframe width="400"></iframe>')
        assert out == ""

    def test_video_mp4_rules(self):
        ok = sanitizer.sanitize_html('<video src="https://cdn.example.com/movie.mp4"></video>')
        assert 'src="https://cdn.example.com/movie.mp4"' in ok
        ok_rel = sanitizer.sanitize_html('<video src="/media/clip.webm"></video>')
        assert "/media/clip.webm" in ok_rel
        bad = sanitizer.sanitize_html('<video src="https://x.com/movie.mkv"></video>')
        assert bad == ""

    def test_style_whitelist(self):
        out = sanitizer.sanitize_html(
            '<p style="font-family: Vazirmatn; font-size: 18px; color: #0082CA; '
            "text-align: justify; animation: spin;\">متن</p>"
        )
        assert "font-family" in out
        assert "Vazirmatn" in html.unescape(out)
        assert "font-size: 18px" in out
        assert "color: #0082CA" in out
        assert "text-align: justify" in out
        assert "animation" not in out

    def test_disallowed_font_family_dropped(self):
        out = sanitizer.sanitize_html('<span style="font-family: Comic Sans;">a</span>')
        assert "Comic" not in out
        assert "font-family" not in out

    def test_font_size_bounds(self):
        out = sanitizer.sanitize_html('<p style="font-size: 90px;">big</p>')
        assert out == "<p>big</p>"
        out2 = sanitizer.sanitize_html('<p style="font-size: 12px;">ok</p>')
        assert "12px" in out2

    def test_disallowed_tag_dropped_child_text_kept(self):
        out = sanitizer.sanitize_html("<h1>عنوان</h1><p>متن</p>")
        assert "h1" not in out and "عنوان" in out and "<p>متن</p>" in out

    def test_text_escaped(self):
        out = sanitizer.sanitize_html("<p>سلام &lt;script&gt; دنیا</p>")
        assert out == "<p>سلام &lt;script&gt; دنیا</p>"

    def test_orphan_tag_force_closed(self):
        out = sanitizer.sanitize_html("<ul><li>آیتم")
        assert out.endswith("</li></ul>")

    def test_comments_dropped(self):
        out = sanitizer.sanitize_html("<p>a</p><!-- function() --><p>b</p>")
        assert "--" not in out and out == "<p>a</p><p>b</p>"

    def test_javascript_href_dropped(self):
        out = sanitizer.sanitize_html("<a href=\"javascript:evil()\">لینک</a>")
        assert out == "<a>لینک</a>"

    def test_target_blank_gets_noopener(self):
        out = sanitizer.sanitize_html('<a href="https://x.com" target="_blank">X</a>')
        assert 'rel="noopener"' in out

    def test_too_long_rejected(self):
        with pytest.raises(ValueError):
            sanitizer.sanitize_html("<p>" + "x" * (sanitizer.MAX_HTML_LENGTH + 1) + "</p>")


class TestDerivation:
    def test_reading_minutes_bounded(self):
        assert sanitizer.estimate_reading_minutes("") == 1
        words = " ".join(["کلمه"] * 450)
        assert sanitizer.estimate_reading_minutes("<p>{}</p>".format(words)) == 2
        assert sanitizer.estimate_reading_minutes("<p>یک دو</p>") == 1

    def test_excerpt_from_html(self):
        excerpt = sanitizer.derive_excerpt("<p>سلام دنیا</p><p>بخش دوم</p>", limit=10)
        assert excerpt == "سلام دنیا "
