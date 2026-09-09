import sys; sys.path.insert(0,'.')
from app.db.session import engine, get_session
from sqlmodel import select, Session
from app.models import Article, ArticleCategory, User
from datetime import datetime, timezone
import uuid

now = datetime.now(timezone.utc)
with Session(engine) as s:
    cats = s.exec(select(ArticleCategory)).all()
    users = s.exec(select(User)).all()
    admin_id = users[0].id if users else None

    # 3rd category if not exists
    existing_slugs = [c.slug for c in cats]
    if 'techniques' not in existing_slugs:
        nc = ArticleCategory(id=str(uuid.uuid4()), name='\u0631\u0648\u0634\u0647\u0627', slug='techniques')
        s.add(nc); s.commit(); s.refresh(nc)
        cats.append(nc)

    cat_ids = [c.id for c in cats]
    titles = [
        (0,'\u0622\u0645\u0648\u0632\u0634 \u0633\u0627\u062E\u062A \u0648\u0632\u0647 \u0633\u0641\u0627\u0644\u06CC'),
        (0,'\u062A\u062F\u0631\u06CC\u0628 \u0631\u0646\u06AF\u200C\u0631\u06CC\u0632\u06CC \u06AF\u0644\u0627\u0632\u0648\u0631'),
        (0,'\u0622\u0645\u0648\u0632\u0634 \u06A9\u0627\u0631 \u0628\u0627 \u06A9\u0648\u0631\u0647 \u062F\u0633\u062A\u06CC'),
        (0,'\u0631\u0648\u0634 \u067E\u062E\u062A \u0648 \u067E\u062E\u062A \u0645\u062C\u062F\u062F \u0633\u0631\u0627\u0645\u06CC\u06A9'),
        (0,'\u0622\u0645\u0648\u0632\u0634 \u062A\u0631\u06A9\u06CC\u0628 \u0627\u0646\u0648\u0627\u0639 \u062E\u0627\u0645'),
        (0,'\u0646\u06A9\u0627\u062A \u062D\u06CC\u0627\u062A\u06CC \u062F\u0631 \u0633\u0627\u062E\u062A \u0641\u0631\u0645 \u0647\u0646\u0631\u06CC'),
        (0,'\u0622\u0645\u0648\u0632\u0634 \u0633\u0627\u062E\u062A \u062A\u0627\u0628\u0644\u0647 \u0633\u0641\u0627\u0644\u06CC'),
        (1,'\u0645\u0639\u0631\u0641\u06CC \u0633\u0631\u0627\u0645\u06CC\u06A9 \u067E\u0631\u0634\u06CC\u0646'),
        (1,'\u0628\u0631\u0631\u0633\u06CC \u0633\u062A\u0648\u0646\u0647\u0627\u06CC \u062A\u0632\u06CC\u06CC\u0646\u06CC'),
        (1,'\u0645\u0639\u0631\u0641\u06CC \u06AF\u0644\u062F\u0627\u0646\u0647\u200C\u0647\u0627\u06CC \u0627\u06CC\u0632\u0646\u06CC\u06A9'),
        (1,'\u0628\u0631\u0631\u0633\u06CC \u0633\u0631\u0627\u0645\u06CC\u06A9 \u0631\u0627\u06A9\u0648'),
        (1,'\u0645\u0642\u0627\u06CC\u0633\u0647 \u0633\u0641\u0627\u0644 \u0648 \u067E\u0631\u0633\u0644\u06CC\u0646'),
        (1,'\u0645\u0639\u0631\u0641\u06CC \u06A9\u0627\u0631\u0628\u0631\u062F \u067E\u0631\u0633\u0644\u06CC\u0646'),
        (2,'\u0631\u0648\u0634 \u0622\u062A\u0634\u200C\u062F\u0647\u06CC \u062F\u0631 \u062F\u0645\u0627\u06CC \u0628\u0627\u0644\u0627'),
        (2,'\u062A\u06A9\u0646\u06CC\u06A9 \u0644\u06CC\u0633\u062A\u0647 \u200C\u06A9\u0627\u0631\u06CC \u0633\u0637\u062D'),
        (2,'\u0631\u0648\u0634\u0647\u0627\u06CC \u067E\u0648\u0634\u0634 \u06AF\u0644\u0627\u0632\u0648\u0631'),
        (2,'\u062A\u062C\u0631\u0628\u0647 \u0628\u0627 \u06A9\u0648\u0631\u0647 \u0633\u0627\u062E\u062A\u0647 \u062F\u0633\u062A\u06CC'),
        (2,'\u0631\u0648\u0634 \u062A\u0631\u06A9\u06CC\u0628 \u0631\u0646\u06AF \u062F\u0631 \u0633\u0631\u0627\u0645\u06CC\u06A9'),
        (2,'\u062A\u06A9\u0646\u06CC\u06A9 \u0645\u0627\u0646\u0646\u06AF \u0648 \u0633\u0627\u0646\u062F\u0628\u0644\u0627\u0633\u062A'),
        (2,'\u0631\u0648\u0634 \u0628\u0627\u0641\u062A\u06AF\u06CC \u062F\u0631 \u0633\u0631\u0627\u0645\u06CC\u06A9'),
    ]
    created = 0
    for ci, t in titles:
        a = Article(
            id=str(uuid.uuid4()), title=t,
            slug='test-'+str(uuid.uuid4())[:8],
            body='<p>Test content</p>', excerpt='Excerpt: '+t[:30],
            category_id=cat_ids[ci], is_published=True,
            published_at=now, author_id=admin_id,
        )
        s.add(a); created += 1
    s.commit()
    total = len(s.exec(select(Article)).all())
    print(f'Created {created}, total articles: {total}')