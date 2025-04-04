import { ent_spec } from "@mixeditor/core";
import { CodeBlockEntType, DocCodeInlineCompo, DocHeadingCompo, DocLinkCompo, DocTextBoldCompo, ParagraphEntType, TextEntType } from "@mixeditor/document";

export const sql_intro = () => [
  ent_spec(
    ParagraphEntType,
    {
      children: [
        ent_spec(TextEntType, {
          content: "深入理解 SQL SELECT 语句",
        }),
      ],
    },
    [new DocHeadingCompo(1)]
  ),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content:
          "SQL（Structured Query Language）是用于管理和操作关系型数据库的标准语言。在 SQL 中，",
      }),
      ent_spec(
        TextEntType,
        {
          content: "SELECT",
        },
        [new DocCodeInlineCompo()]
      ),
      ent_spec(TextEntType, {
        content:
          " 句是最常用且功能强大的命令之一。它允许我们从数据库中检索数据，并根据需要进行过滤、排序和分组。本文将详细介绍 ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "SELECT",
        },
        [new DocCodeInlineCompo()]
      ),
      ent_spec(TextEntType, {
        content: " 语句的语法、用法以及一些高级特性。",
      }),
    ],
  }),
  ent_spec(
    ParagraphEntType,
    {
      children: [
        ent_spec(TextEntType, {
          content: "基本语法",
        }),
      ],
    },
    [new DocHeadingCompo(2)]
  ),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(
        TextEntType,
        {
          content: "SELECT",
        },
        [new DocCodeInlineCompo()]
      ),
      ent_spec(TextEntType, {
        content: " 语句的基本语法如下：",
      }),
    ],
  }),
  ent_spec(CodeBlockEntType, {
    content: "SELECT column1, column2, ...\nFROM table_name\nWHERE condition",
  }),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content: "● ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "SELECT：",
        },
        [new DocTextBoldCompo()]
      ),
      ent_spec(TextEntType, {
        content: "指定要检索的列。可以使用 ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "*",
        },
        [new DocCodeInlineCompo()]
      ),
      ent_spec(TextEntType, {
        content: " 表示选择所有列。",
      }),
    ],
  }),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content: "● ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "FROM：",
        },
        [new DocTextBoldCompo()]
      ),
      ent_spec(TextEntType, {
        content: "指定要从中检索数据的表。",
      }),
    ],
  }),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content: "● ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "WHERE：",
        },
        [new DocTextBoldCompo()]
      ),
      ent_spec(TextEntType, {
        content: "​（可选）：用于指定筛选条件，只有满足条件的行才会被返回。",
      }),
    ],
  }),
  ent_spec(
    ParagraphEntType,
    {
      children: [
        ent_spec(TextEntType, {
          content: "参考资料",
        }),
      ],
    },
    [new DocHeadingCompo(2)]
  ),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content: "● ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "SQL 教程",
        },
        [new DocLinkCompo("https://www.w3schools.com/sql/")]
      ),
    ],
  }),
  ent_spec(ParagraphEntType, {
    children: [
      ent_spec(TextEntType, {
        content: "● ",
      }),
      ent_spec(
        TextEntType,
        {
          content: "MySQL 官方文档",
        },
        [new DocLinkCompo("https://dev.mysql.com/doc/")]
      ),
    ],
  }),
];
