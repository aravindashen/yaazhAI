from typing import List, Dict, Any

def format_citations(citations: List[Dict[str, Any]], style: str = "BIBTEX") -> str:
    """Format academic citations in BibTeX, APA, Chicago, or MLA format."""
    style_upper = style.upper()
    
    if style_upper == "BIBTEX":
        bibtex_entries = []
        for idx, c in enumerate(citations):
            key = f"cict_{c.get('workTitle', 'tamil')}_{idx+1}".lower().replace(" ", "_")
            entry = (
                f"@incollection{{{key},\n"
                f"  title = {{{c.get('workTitle', 'Classical Tamil Work')}}},\n"
                f"  author = {{{c.get('authorOrPoet', 'Anonymous Classical Bard')}}},\n"
                f"  booktitle = {{{c.get('edition', 'CICT Canonical Classical Tamil Corpus')}}},\n"
                f"  chapter = {{{c.get('chapterOrPoem', 'Section')}}},\n"
                f"  number = {{{c.get('verseNumber', 1)}}},\n"
                f"  publisher = {{Central Institute of Classical Tamil (CICT)}},\n"
                f"  year = {{2026}},\n"
                f"  note = {{Trust Status: {c.get('trustStatus', 'VERIFIED')}}}\n"
                f"}}"
            )
            bibtex_entries.append(entry)
        return "\n\n".join(bibtex_entries)
        
    elif style_upper == "APA":
        apa_entries = []
        for c in citations:
            entry = f"{c.get('authorOrPoet', 'Classical Author')}. (n.d.). {c.get('workTitle', 'Tamil Classic')}, {c.get('chapterOrPoem', '')} (Verse {c.get('verseNumber', 1)}). Central Institute of Classical Tamil (CICT)."
            apa_entries.append(entry)
        return "\n\n".join(apa_entries)
        
    elif style_upper == "CHICAGO":
        chicago_entries = []
        for c in citations:
            entry = f"{c.get('authorOrPoet', 'Classical Poet')}. \"{c.get('chapterOrPoem', 'Poem')}.\" In {c.get('workTitle', 'Work')}, verse {c.get('verseNumber', 1)}. Chennai: CICT."
            chicago_entries.append(entry)
        return "\n\n".join(chicago_entries)

    # Default Markdown Dossier
    md_entries = []
    for c in citations:
        md_entries.append(
            f"### {c.get('workTitle', 'Classical Work')} - {c.get('chapterOrPoem', '')}\n"
            f"- **Author/Poet**: {c.get('authorOrPoet', 'Sangam Bard')}\n"
            f"- **Verse**: #{c.get('verseNumber', 1)}\n"
            f"- **Source Edition**: {c.get('edition', 'CICT Standard Series')}\n"
            f"- **Status**: {c.get('trustStatus', 'VERIFIED')}\n"
        )
    return "\n".join(md_entries)
